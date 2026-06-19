# Presale Mobile Command Center

A luxury mobile-presale finance CRM: dashboards, CRM, sales & contracts, a
ledger, commissions, checks, debts, investments, a tunable KPI engine and a
smart alert queue — with role-based panels for management, finance, sellers and
contract specialists.

This repository contains two connected parts:

| Folder      | What it is                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------ |
| `frontend/` | The original single-page UI (`index.html`) — the design this project is built around.      |
| `backend/`  | A production-grade **NestJS + Prisma + PostgreSQL** API implementing that design server-side. |

## How they connect

The frontend was a self-contained demo that stored everything in
`localStorage`, with all of its formulas (order totals, balances, commissions,
risk scoring, KPI evaluation, the alert queue) living in JavaScript.

The backend re-implements **exactly those formulas** in a single pure
calculation engine (`backend/src/domain/engine.ts`) and exposes them over a
secure, role-aware REST API backed by PostgreSQL. Every section the UI renders
maps to an endpoint, and they all stay consistent because they share that one
engine:

```
customers ─┐
sales ─────┼─► engine ─► dashboard KPIs, reports, KPI Studio, alert queue
payments ──┤            (totals · balances · commissions · risk · quality)
checks ────┤
debts ─────┤
investments┘
```

The four demo roles from the UI (`ceo`, `finance`, `seller1`, `contract`) become
real users with hashed passwords, JWT sessions and **server-side** RBAC — the
seller really can only see their own customers, finance really cannot reach the
admin-only audit log, and so on.

## Quick start

### With Docker (everything)

```bash
docker compose up --build
```

Then open **http://localhost:3000** — the web UI is served there and talks to
the live API. Log in with `ceo / 1234`. API docs are at
`http://localhost:3000/api/docs`.

**The system starts empty** (only the login users + KPI templates) so you enter
your own real data. Every section has a form to add records and a حذف (delete)
button on each row: حساب‌ها/صندوق‌ها, اعضا, مشتریان (CRM), فروش, تراکنش, چک,
بدهی, سرمایه‌گذاری, KPI و تعاریف. Use **خروجی JSON** to export everything.

Want the sample demo data back to explore? Set `SEED_DEMO=true` in
`docker-compose.yml` (or the environment) before the first run.

### Local backend

```bash
cd backend
npm install
cp .env.example .env          # set DATABASE_URL + JWT secrets
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

See [`backend/README.md`](backend/README.md) for the full architecture, API
reference, scalability notes and testing guide.

### Frontend

The UI now talks to the live backend: it authenticates via
`POST /api/v1/auth/login`, loads every collection from the API, and sends each
create/update back to the server (data lives in PostgreSQL, not the browser).
It is served by the backend at the root, so the canonical way to use it is to
open **http://localhost:3000** with the backend running. The same file is kept
at `backend/public/index.html` (served) and `frontend/index.html` (reference).

## Quality gates

- `npm run typecheck` / `npm run build` — 0 TypeScript errors
- `npm run lint` — 0 ESLint errors
- `npm test` — engine unit tests
- `npm run test:e2e` — full API tests against a real PostgreSQL database

Demo accounts (password `1234`): `ceo`, `finance`, `seller1`, `contract`.
