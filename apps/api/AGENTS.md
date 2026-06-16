# apps/api

Hono API with Drizzle ORM over node-postgres. ESM (`"type": "module"`).

## Run

- Dev (watch): `pnpm dev` (tsx)
- Build: `pnpm build` (tsc → `dist/`); start: `pnpm start`
- Migrations: `pnpm db:generate` then `pnpm db:migrate` (drizzle-kit)

## Structure

- `src/index.ts` — server entry (`@hono/node-server`, `PORT`).
- `src/app.ts` — Hono app and routes.
- `src/db/schema.ts` — Drizzle schema; `src/db/index.ts` — lazy `getDb()` pool.
- `drizzle/` — generated SQL migrations.

## Notes

- ESM: use `.js` extension on relative imports (e.g. `./app.js`).
- Requires `DATABASE_URL`; `getDb()` throws if unset.
- TS config extends `@flick/typescript-config/node.json`.
