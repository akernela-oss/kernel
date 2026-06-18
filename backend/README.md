# Presale Command Center — Backend

A professional, scalable backend for the **Presale Mobile Command Center** luxury
finance CRM (the `frontend/index.html` single-page app). Built with **NestJS +
Prisma + PostgreSQL**, it implements exactly the data model and business rules
the frontend renders — server-side this time, with authentication, role-based
access control, an audit log, a tunable KPI/formula engine and a smart alert
queue.

> All modules — sales, transactions, checks, debts, investments, members, KPIs
> and the alert queue — are connected through a single **pure calculation
> engine** (`src/domain/engine.ts`). The formulas are defined once, so every
> endpoint stays consistent on the same basis.

## Tech stack

| Concern         | Choice                                            |
| --------------- | ------------------------------------------------- |
| Framework       | NestJS 10 (modular, DI)                           |
| Language        | TypeScript (strict-ish, 0 build errors)           |
| Database / ORM  | PostgreSQL 16 + Prisma 5 (type-safe, pooled)      |
| Auth            | JWT access + rotating/revocable refresh tokens    |
| Authorization   | Server-side RBAC guards (`@Roles`)                |
| Validation      | class-validator + global `ValidationPipe`         |
| Passwords       | bcrypt                                            |
| Hardening       | Helmet, CORS, rate limiting (`@nestjs/throttler`) |
| Observability   | Structured logging (pino), audit log, `/health`   |
| Docs            | Swagger / OpenAPI at `/api/docs`                  |
| Tests           | Jest unit (engine) + e2e (real Postgres)          |

## Architecture

```
src/
├── domain/            # PURE business logic — the shared heart
│   ├── engine.ts      #   sale/customer/member/debt/check/investment derivations,
│   │                  #   KPI aggregation, KPI evaluation, alert queue
│   ├── constants.ts   #   vocabulary + defaults (mirrors the frontend SEED)
│   └── types.ts       #   plain, serializable domain shapes
├── engine/            # Bridges the DB and the engine (load → map → compute, cached)
├── prisma/            # Prisma client provider
├── common/            # guards, decorators, interceptors (audit), filters,
│                      # pagination, cache, the reusable CRUD base service
├── auth/  users/      # authentication + user management
├── resources/         # CRUD modules: customers, members, accounts, sales,
│                      # transactions, checks, debts, investments, expenses
└── modules/           # aggregate/read modules: dashboard, queue, reports,
                       # kpi (studio), finance-definitions, settings, audit, health
```

**Why a pure engine?** It contains no I/O, so it is trivially unit-tested and
guarantees the backend produces the *same* numbers as the frontend. Services
load rows from Prisma, map them to plain shapes, and hand them to the engine.

## Getting started

### Prerequisites

- Node.js 22+
- PostgreSQL 16 (local or via the root `docker-compose.yml`)

### 1. Install & configure

```bash
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL + JWT secrets
```

### 2. Database

```bash
npx prisma migrate deploy   # apply schema
npm run prisma:seed         # load the demo dataset (and the 4 demo users)
```

### 3. Run

```bash
npm run start:dev           # watch mode
# or
npm run build && npm run start:prod
```

API is served at `http://localhost:3000/api/v1`, docs at `http://localhost:3000/api/docs`.

### Demo accounts (password `1234`)

| Username   | Role              | Access                                               |
| ---------- | ----------------- | ---------------------------------------------------- |
| `ceo`      | ADMIN             | everything                                           |
| `finance`  | FINANCE           | KPIs, checks, transactions, debts, investments, …    |
| `seller1`  | SELLER            | register + view **only their own** customers         |
| `contract` | CONTRACT          | queue, customers, sales                              |

## API overview

All routes are prefixed with `/api/v1`. Send `Authorization: Bearer <token>`.

| Area              | Endpoints                                                            |
| ----------------- | ------------------------------------------------------------------- |
| Auth              | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Dashboard         | `GET /dashboard`                                                    |
| Alert queue       | `GET /queue?mode=risk\|delivery\|balance\|contract\|checks\|debts`  |
| Reports           | `GET /reports`                                                      |
| KPI Studio        | `GET /kpi/studio`, `GET /kpi/report`, `GET /kpi/metrics`, CRUD `/kpi/definitions` |
| Customers         | CRUD `/customers` (seller-scoped)                                   |
| Sales             | CRUD `/sales`                                                       |
| Transactions      | CRUD `/transactions`                                                |
| Members           | CRUD `/members`                                                     |
| Accounts          | CRUD `/accounts`                                                    |
| Checks            | CRUD `/checks`                                                      |
| Debts             | CRUD `/debts`                                                       |
| Investments       | CRUD `/investments`                                                 |
| Expenses          | CRUD `/expenses`                                                    |
| Finance defs      | CRUD `/finance-definitions`                                         |
| Settings/Formulas | `GET /settings`, `PATCH /settings`                                  |
| Users             | CRUD `/users` (admin)                                               |
| Audit log         | `GET /audit` (admin)                                                |
| Health            | `GET /health` (public)                                              |

List endpoints support `?page=&limit=&search=&order=` and return
`{ data, meta: { total, page, limit, pages } }`. The customers/sales/members/
accounts/checks/debts/investments lists return **derived** rows (totals,
balances, risk, alerts) computed by the engine.

## Testing

```bash
npm test            # unit tests (the calculation engine)
npm run test:e2e    # end-to-end against the presale_test database
```

The e2e suite reseeds `presale_test` for full reproducibility, then exercises
auth, RBAC, engine parity over real data, the cross-module flow
(customer → sale → transaction → KPIs), validation, settings and auditing.

## Built for scale

- **Stateless auth** (JWT) → horizontally scalable behind a load balancer.
- **Connection pooling** via a single shared Prisma client.
- **Indexes** on every foreign key and hot column (delivery date, due dates, status).
- **Pagination** on all list endpoints (max 200/page).
- **Short-TTL aggregate cache** with write-through invalidation, so bursts of
  dashboard/KPI reads don't each recompute the whole bundle. Swap the in-memory
  `CacheService` for Redis to share it across instances.
- **Rate limiting** globally and a tighter limit on `/auth/login`.
- **Collision-free ids** (cuid) + DB-generated sequences for friendly codes —
  safe under concurrent writes (no race conditions).

## Docker

From the repository root:

```bash
docker compose up --build
docker compose exec api npm run prisma:seed
```
