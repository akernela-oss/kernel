import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { execSync } from 'child_process';
import { join } from 'path';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * End-to-end tests against the real PostgreSQL `presale_test` database
 * (migrated + seeded before this suite runs). They prove authentication,
 * server-side RBAC, engine parity over real data, cross-module wiring,
 * validation and auditing all work together.
 */
describe('Presale Command Center API (e2e)', () => {
  let app: NestExpressApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  const tokens: Record<string, string> = {};

  const login = async (username: string, password = '1234') => {
    const res = await request(server).post('/api/v1/auth/login').send({ username, password });
    return res;
  };
  const auth = (role: string) => ({ Authorization: `Bearer ${tokens[role]}` });

  beforeAll(async () => {
    // Reset the test database to a known baseline (clears + reseeds) so the
    // suite is fully reproducible regardless of previous runs.
    execSync('npx ts-node prisma/seed.ts', {
      cwd: join(__dirname, '..'),
      env: process.env,
      stdio: 'ignore',
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    server = app.getHttpServer();

    for (const role of ['ceo', 'finance', 'seller1', 'contract']) {
      const res = await login(role);
      tokens[role] = res.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('web UI', () => {
    it('serves the SPA at the root', async () => {
      const res = await request(server).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('loginForm');
    });
  });

  describe('health', () => {
    it('reports database connectivity', async () => {
      const res = await request(server).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.info.database.status).toBe('up');
    });
  });

  describe('auth & RBAC', () => {
    it('logs in a valid user and returns a session', async () => {
      const res = await login('ceo');
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.user.allowedPages).toContain('dashboard');
    });

    it('rejects bad credentials', async () => {
      const res = await login('ceo', 'wrong');
      expect(res.status).toBe(401);
    });

    it('blocks unauthenticated access to protected routes', async () => {
      expect((await request(server).get('/api/v1/dashboard')).status).toBe(401);
    });

    it('returns the current user from /auth/me', async () => {
      const res = await request(server).get('/api/v1/auth/me').set(auth('finance'));
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('FINANCE');
    });

    it('forbids a seller from the finance dashboard', async () => {
      const res = await request(server).get('/api/v1/dashboard').set(auth('seller1'));
      expect(res.status).toBe(403);
    });

    it('refreshes tokens and rotates the refresh token', async () => {
      const loginRes = await login('finance');
      const refreshToken = loginRes.body.refreshToken;
      const res = await request(server).post('/api/v1/auth/refresh').send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      // Old refresh token is now revoked.
      const reuse = await request(server).post('/api/v1/auth/refresh').send({ refreshToken });
      expect(reuse.status).toBe(401);
    });
  });

  describe('engine parity over seeded data', () => {
    it('computes the headline KPIs exactly', async () => {
      const res = await request(server).get('/api/v1/dashboard').set(auth('ceo'));
      expect(res.status).toBe(200);
      const k = res.body.kpis;
      expect(k.salesTotal).toBe(282_390_000);
      expect(k.received).toBe(330_000_000);
      expect(k.liquidity).toBe(398_000_000);
      expect(k.customerBalance).toBe(42_430_000);
    });

    it('serves the alert queue ordered by risk', async () => {
      const res = await request(server).get('/api/v1/queue?mode=risk').set(auth('finance'));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.rows)).toBe(true);
      for (let i = 1; i < res.body.rows.length; i++) {
        expect(res.body.rows[i - 1].risk).toBeGreaterThanOrEqual(res.body.rows[i].risk);
      }
    });

    it('rejects an invalid queue mode', async () => {
      const res = await request(server).get('/api/v1/queue?mode=bogus').set(auth('finance'));
      expect(res.status).toBe(400);
    });
  });

  describe('seller scoping', () => {
    it('shows the seller only their own customers', async () => {
      const res = await request(server).get('/api/v1/customers').set(auth('seller1'));
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(3);
    });
  });

  describe('KPI studio & catalog', () => {
    it('lists the metric catalog', async () => {
      const res = await request(server).get('/api/v1/kpi/metrics').set(auth('finance'));
      expect(res.status).toBe(200);
      expect(res.body.find((m: { value: string }) => m.value === 'collectionRate')).toBeDefined();
    });

    it('evaluates every seeded KPI definition', async () => {
      const res = await request(server).get('/api/v1/kpi/studio').set(auth('finance'));
      expect(res.status).toBe(200);
      expect(res.body.definitions.length).toBe(14);
      expect(res.body.metrics.salesTotal).toBe(282_390_000);
      res.body.definitions.forEach((d: { status: string; score: number }) => {
        expect(typeof d.status).toBe('string');
        expect(typeof d.score).toBe('number');
      });
    });
  });

  describe('frontend data contract', () => {
    const paths = [
      '/customers',
      '/members',
      '/accounts',
      '/sales',
      '/transactions',
      '/checks',
      '/debts',
      '/investments',
      '/expenses',
      '/kpi/definitions',
      '/finance-definitions',
    ];
    it('every list endpoint the UI bootstraps returns a paginated array', async () => {
      for (const p of paths) {
        const res = await request(server).get(`/api/v1${p}?limit=200`).set(auth('ceo'));
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });
    it('settings exposes formulas the UI needs', async () => {
      const res = await request(server).get('/api/v1/settings').set(auth('ceo'));
      expect(res.status).toBe(200);
      expect(res.body.formulas.risk).toBeDefined();
      expect(Array.isArray(res.body.formulas.discountOptions)).toBe(true);
    });
  });

  describe('validation', () => {
    it('rejects a customer without a name', async () => {
      const res = await request(server)
        .post('/api/v1/customers')
        .set(auth('finance'))
        .send({ phone: '0912' });
      expect(res.status).toBe(400);
    });
  });

  describe('cross-module flow: customer → sale → transaction → KPIs', () => {
    let customerId: string;
    let saleId: string;
    let baselineSalesTotal: number;

    it('captures the baseline sales total', async () => {
      const res = await request(server).get('/api/v1/dashboard').set(auth('ceo'));
      baselineSalesTotal = res.body.kpis.salesTotal;
    });

    it('creates a customer', async () => {
      const res = await request(server)
        .post('/api/v1/customers')
        .set(auth('finance'))
        .send({ name: 'مشتری تست', phone: '09120000999', city: 'تهران', status: 'فعال' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.code).toMatch(/^CUS-/);
      customerId = res.body.id;
    });

    it('creates a sale for that customer', async () => {
      const res = await request(server).post('/api/v1/sales').set(auth('finance')).send({
        customerId,
        category: 'آیفون',
        model: 'iPhone Test',
        quantity: 1,
        marketPrice: 10_000_000,
        discount: 0,
        contractStatus: 'امضا شده',
      });
      expect(res.status).toBe(201);
      saleId = res.body.id;
    });

    it('reflects the new sale in the dashboard total (cache invalidated)', async () => {
      const res = await request(server).get('/api/v1/dashboard').set(auth('ceo'));
      expect(res.body.kpis.salesTotal).toBe(baselineSalesTotal + 10_000_000);
    });

    it('records a customer receipt and updates the customer balance', async () => {
      const accounts = await request(server).get('/api/v1/accounts').set(auth('finance'));
      const accountId = accounts.body.data[0].id;

      await request(server)
        .post('/api/v1/transactions')
        .set(auth('finance'))
        .send({
          accountId,
          type: 'دریافت از مشتری',
          orderId: saleId,
          customerId,
          inflow: 4_000_000,
          method: 'نقدی',
        })
        .expect(201);

      const customers = await request(server)
        .get('/api/v1/customers?search=مشتری تست')
        .set(auth('finance'));
      const created = customers.body.data.find((c: { id: string }) => c.id === customerId);
      expect(created.total).toBe(10_000_000);
      expect(created.paid).toBe(4_000_000);
      expect(created.balance).toBe(6_000_000);
    });
  });

  describe('settings drive the engine', () => {
    it('reads and updates Formula Studio settings', async () => {
      const get = await request(server).get('/api/v1/settings').set(auth('finance'));
      expect(get.status).toBe(200);
      expect(get.body.settings.nearDeliveryDays).toBeDefined();

      const patch = await request(server)
        .patch('/api/v1/settings')
        .set(auth('finance'))
        .send({ nearDeliveryDays: 21 });
      expect(patch.status).toBe(200);
      expect(patch.body.settings.nearDeliveryDays).toBe(21);
    });
  });

  describe('audit log', () => {
    it('records mutations and is admin-only', async () => {
      const forbidden = await request(server).get('/api/v1/audit').set(auth('finance'));
      expect(forbidden.status).toBe(403);

      const res = await request(server).get('/api/v1/audit').set(auth('ceo'));
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBeGreaterThan(0);
      expect(res.body.data[0].method).toBeDefined();
    });
  });
});
