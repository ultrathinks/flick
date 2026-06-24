# apps/api

Hono API with Drizzle ORM over node-postgres. ESM (`"type": "module"`).

## Run

- Infra up (repo root): `docker compose up -d` (Postgres host 5432, Redis host 6379)
- Env: copy `apps/api/.env.example` and fill values; `PAYOUT_ENCRYPTION_KEY` must be 32-byte base64. `REDIS_URL` optional (rate limit falls back to in-memory when unset).
- Dev (watch): `pnpm dev` (tsx)
- Build: `pnpm build` (tsc → `dist/`); start: `pnpm start`
- Migrations: `pnpm db:generate` then `pnpm db:migrate` (drizzle-kit)
- Tests: `pnpm --filter api test` (vitest, needs a migrated DB; point `DATABASE_URL` at a test DB such as `flick_test`)

## Structure

- `src/index.ts` — server entry (`@hono/node-server`, `PORT`).
- `src/app.ts` — Hono app, `/v1` routing, error handler.
- `src/routes/*` — resource routes (auth, users, booths, products, kiosks, orders/payments, money, payouts, stats).
- `src/auth/*` — Dodam OAuth, sessions, principal middleware (`requireAuth`, `requireAdmin`, `requireKiosk`).
- `src/db/schema/*` — Drizzle schema (`users`, `sessions`, `domain.ts`); `src/db/index.ts` — singleton `getDb()`.
- `src/lib/*` — errors, constants, rate limit, security (hash/encrypt/mask).
- `drizzle/` — generated SQL migrations.

## Money invariant

`users.balance == SUM(transactions of user)`. Every balance change writes a `transactions` row and updates `users.balance` in the same DB transaction. Enforced by DB partial-unique indexes: one `grant` per user, one refund per purchase, charge idempotency `(admin_id, idempotency_key)`, one `requested` payout per user, one pending payment per order.

## Notes

- ESM: write the real `.ts` extension on relative imports (e.g. `./app.ts`); `rewriteRelativeImportExtensions` emits `.js` in `dist/`.
- Requires `DATABASE_URL`; `getDb()` throws if unset.
- TS config extends `@flick/typescript-config/node.json`.
