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
docker compose exec api npm run prisma:seed
# API → http://localhost:3000/api/v1   ·   Docs → http://localhost:3000/api/docs
```

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

Open `frontend/index.html` directly in a browser to explore the original UI and
data model. It points to the demo accounts documented in `frontend/README_FA.md`.
To drive it from the live API instead of `localStorage`, point its fetch calls
at `/api/v1` and authenticate via `POST /api/v1/auth/login`.

## Quality gates

- `npm run typecheck` / `npm run build` — 0 TypeScript errors
- `npm run lint` — 0 ESLint errors
- `npm test` — engine unit tests
- `npm run test:e2e` — full API tests against a real PostgreSQL database

Demo accounts (password `1234`): `ceo`, `finance`, `seller1`, `contract`.
