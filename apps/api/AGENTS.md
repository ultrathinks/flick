# apps/api

Hono API with Drizzle ORM over node-postgres. ESM (`"type": "module"`).

## Run

- Infra up (repo root): `docker compose up -d` (Postgres host 5432, Redis host 6379)
- Env: copy `apps/api/.env.example` and fill values. `REDIS_URL` is required: rate limiting falls back to in-memory when unset, but the realtime event bus (`src/lib/events.ts`) needs Redis pub/sub.
- Dev (watch): `pnpm dev` (tsx)
- Build: `pnpm build` (tsc → `dist/`); start: `pnpm start`
- Migrations: `pnpm db:generate` then `pnpm db:migrate` (drizzle-kit)
- Tests: `pnpm --filter api test` (vitest, needs a migrated DB; point `DATABASE_URL` at a test DB such as `flick_test`)

## Structure

- `src/index.ts` — server entry (`@hono/node-server`, `PORT`).
- `src/app.ts` — `OpenAPIHono` app, `/v1` routing, error handler. Serves Scalar docs at `/v1/docs` and the OpenAPI spec at `/v1/openapi.json` only when `NODE_ENV !== "production"`.
- `src/routes/*` — resource routes (auth, users, booths, products, kiosks, orders/payments, money, payouts, stats). Each route is defined with `createRoute` + `OpenAPIHono.openapi()`; middleware (`requireAuth`/`requireAdmin`/`requireKiosk`, `rateLimit`) goes in the route's `middleware` array, and `c.json(body, status)` must pass an explicit status code.
- `src/openapi/*` — shared request/response zod schemas (`schemas.ts`, derived from Drizzle via `drizzle-zod`) and helpers (`helpers.ts`: `jsonContent`, `errorResponse`, `errorResponseSchema`).
- `src/auth/*` — Dodam OAuth, sessions, principal middleware (`requireAuth`, `requireAdmin`, `requireKiosk`). `rotateRefresh` (`session.ts`) is rotating: it moves the presented refresh token into a short-lived `previous_refresh_token_hash` grace slot (30s) so concurrent refreshes from the same session (e.g. a server-render refresh redirect racing widget proxy calls) don't invalidate each other.
- `src/db/schema/*` — Drizzle schema (`users`, `sessions`, `domain.ts`); `src/db/index.ts` — singleton `getDb()`.
- `src/lib/*` — errors, constants, rate limit, security (hash/encrypt/mask).
- `drizzle/` — generated SQL migrations.

## API docs / OpenAPI

- New routes must use `createRoute` + `OpenAPIHono.openapi()` with explicit `responses` (including 201/204 and error statuses) and shared schemas from `src/openapi/schemas.ts`. The `responses` map is type-load-bearing, not just docs: omitting a status used by `c.json(body, status)` fails `tsc`.
- `app.fetch`/`app.request` and the error envelope `{ error: { code, message } }` (via `app.onError`) are preserved; `AppType` (`typeof appRoutes`) is exported from `src/app.ts` for future `hono/client` (hc) consumption.
- The SSE endpoints (`GET /v1/booths/:id/events` for owners/admins, `GET /v1/kiosks/me/events` for kiosks, `GET /v1/payments/:id/events` for the kiosk payment wait screen) are plain Hono handlers (not `createRoute`) and are intentionally excluded from the OpenAPI spec. They share `src/lib/sse.ts` (`boothEventStream`), which subscribes to the Redis-backed booth event bus (`src/lib/events.ts`, channel `booth:{boothId}`), heartbeats, and cleans up on abort.

## Realtime event bus

- `src/lib/events.ts` publishes/subscribes discriminated `BoothEvent`s (`order.*`, `payment.*`, `product.updated`, `kiosk.presence`, `kiosk.revoked`) over Redis pub/sub on channel `booth:{boothId}`. One shared subscriber connection multiplexes channels via a ref-counted `channel → handlers` map; a separate publisher connection is used for `PUBLISH`. `closeEvents()` runs on shutdown.
- Publish happens **after** the DB transaction commits (never inside `tx`) so rolled-back state is never broadcast — see the confirm/cancel/create handlers in `routes/orders.ts` and product writes in `routes/products.ts`/`routes/booths.ts`.
- Delivery is at-most-once (Redis pub/sub has no persistence). Clients MUST do an authoritative full refetch on every stream (re)connect and treat live events as deltas; a missed event during the subscribe window or a reconnect gap is healed by that refetch.
- Kiosk presence: kiosks POST `/v1/kiosks/me/heartbeat` (~15s) to refresh `kiosks.last_seen_at` and publish `kiosk.presence{online:true}`; POS derives offline locally when `last_seen_at` is older than `KIOSK_PRESENCE_TTL_MS`. `POST /v1/kiosks/:id/revoke` publishes `kiosk.revoked` and force-closes that kiosk's stream.

## Short codes

- `src/lib/codes.ts`: `generateDigitCode` (numeric) and `generatePairingCode` (Crockford-style unambiguous uppercase) plus `generateUniqueCode(make, exists)` retry-on-collision. Pairing codes are 6-char unambiguous, payment codes 6-digit, user charge codes 6-digit — all short enough to key in by hand, uniqueness guaranteed by retry against the live/stored set. `generateSecret` (base64url) stays reserved for security tokens (session/device tokens), never user-facing codes.

## Money invariant

`users.balance == SUM(transactions of user)`. Every balance change writes a `transactions` row and updates `users.balance` in the same DB transaction. A purchase (spend) is terminal — there is no refund path, so a paid order never reverses. Enforced by DB partial-unique indexes: one `grant` per user, one `purchase` per order, charge idempotency `(admin_id, idempotency_key)`, one pending payment per order. Payouts are a static record of the account to return each user's leftover balance to after the festival (one row per user); the platform does not move that money, so payouts write no `transactions`. Donation and payout exclude the base grant: per user `기부 = max(0, spent − grant)` and `환급 = min(charge, balance)`, so `실충전 = 기부 + 환급`.

## Notes

- ESM: write the real `.ts` extension on relative imports (e.g. `./app.ts`); `rewriteRelativeImportExtensions` emits `.js` in `dist/`.
- Requires `DATABASE_URL`; `getDb()` throws if unset.
- TS config extends `@flick/typescript-config/node.json`.
