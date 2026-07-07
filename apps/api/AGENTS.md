# apps/api

Hono API with Drizzle ORM over node-postgres. ESM (`"type": "module"`).

## Run

- Infra up (repo root): `docker compose up -d` (Postgres host 5432, Redis host 6379)
- Env: copy `apps/api/.env.example` and fill values. `REDIS_URL` optional (rate limit falls back to in-memory when unset).
- Dev (watch): `pnpm dev` (tsx)
- Build: `pnpm build` (tsc → `dist/`); start: `pnpm start`
- Migrations: `pnpm db:generate` then `pnpm db:migrate` (drizzle-kit)
- Tests: `pnpm --filter api test` (vitest, needs a migrated DB; point `DATABASE_URL` at a test DB such as `flick_test`)

## Structure

- `src/index.ts` — server entry (`@hono/node-server`, `PORT`).
- `src/app.ts` — `OpenAPIHono` app, `/v1` routing, error handler. Serves Scalar docs at `/v1/docs` and the OpenAPI spec at `/v1/openapi.json` only when `NODE_ENV !== "production"`.
- `src/routes/*` — resource routes (auth, users, booths, products, kiosks, orders/payments, money, payouts, stats). Each route is defined with `createRoute` + `OpenAPIHono.openapi()`; middleware (`requireAuth`/`requireAdmin`/`requireKiosk`, `rateLimit`) goes in the route's `middleware` array, and `c.json(body, status)` must pass an explicit status code.
- `src/openapi/*` — shared request/response zod schemas (`schemas.ts`, derived from Drizzle via `drizzle-zod`) and helpers (`helpers.ts`: `jsonContent`, `errorResponse`, `errorResponseSchema`).
- `src/auth/*` — Dodam OAuth, sessions, principal middleware (`requireAuth`, `requireAdmin`, `requireKiosk`).
- `src/db/schema/*` — Drizzle schema (`users`, `sessions`, `domain.ts`); `src/db/index.ts` — singleton `getDb()`.
- `src/lib/*` — errors, constants, rate limit, security (hash/encrypt/mask).
- `drizzle/` — generated SQL migrations.

## API docs / OpenAPI

- New routes must use `createRoute` + `OpenAPIHono.openapi()` with explicit `responses` (including 201/204 and error statuses) and shared schemas from `src/openapi/schemas.ts`. The `responses` map is type-load-bearing, not just docs: omitting a status used by `c.json(body, status)` fails `tsc`.
- `app.fetch`/`app.request` and the error envelope `{ error: { code, message } }` (via `app.onError`) are preserved; `AppType` (`typeof appRoutes`) is exported from `src/app.ts` for future `hono/client` (hc) consumption.
- The SSE endpoint `GET /v1/payments/:id/events` is a plain Hono handler (not `createRoute`) and is intentionally excluded from the OpenAPI spec.

## Money invariant

`users.balance == SUM(transactions of user)`. Every balance change writes a `transactions` row and updates `users.balance` in the same DB transaction. Enforced by DB partial-unique indexes: one `grant` per user, one refund per purchase, charge idempotency `(admin_id, idempotency_key)`, one `requested` payout per user, one pending payment per order.

## Notes

- ESM: write the real `.ts` extension on relative imports (e.g. `./app.ts`); `rewriteRelativeImportExtensions` emits `.js` in `dist/`.
- Requires `DATABASE_URL`; `getDb()` throws if unset.
- TS config extends `@flick/typescript-config/node.json`.
