#!/usr/bin/env bash
#
# SessionStart hook — make the repo ready to build, lint and test in a fresh
# (ephemeral) web session. Fully best-effort: it never fails the session.
#
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND="$ROOT/backend"
LOG="$(mktemp)"

{
  # 1. Start PostgreSQL if it is installed but not running.
  if command -v pg_ctlcluster >/dev/null 2>&1; then
    pg_ctlcluster 16 main start 2>/dev/null || true
  fi

  # 2. Ensure the role and databases exist.
  if command -v psql >/dev/null 2>&1 && id postgres >/dev/null 2>&1; then
    su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='presale'\" | grep -q 1 \
      || psql -c \"CREATE ROLE presale LOGIN PASSWORD 'presale_pw' CREATEDB;\"" 2>/dev/null || true
    su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='presale'\" | grep -q 1 \
      || psql -c 'CREATE DATABASE presale OWNER presale;'" 2>/dev/null || true
    su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='presale_test'\" | grep -q 1 \
      || psql -c 'CREATE DATABASE presale_test OWNER presale;'" 2>/dev/null || true
  fi

  # 3. Backend dependencies + Prisma client + schema.
  if [ -d "$BACKEND" ]; then
    cd "$BACKEND" || exit 0
    [ -d node_modules ] || npm install --no-audit --no-fund 2>/dev/null || true
    npx prisma generate 2>/dev/null || true
    npx prisma migrate deploy 2>/dev/null || true
  fi
} >"$LOG" 2>&1

echo "Presale backend environment ready (PostgreSQL + deps + Prisma)."
exit 0
