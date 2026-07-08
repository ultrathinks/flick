<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices. Notably, the `middleware` file convention is deprecated and renamed to `proxy` (`src/proxy.ts`).
<!-- END:nextjs-agent-rules -->

# apps/admin

Platform-operator back-office (Next.js 16 App Router + React 19). Operators approve/reject booths, monitor all orders, process student payouts (환급), charge balances by scanning user QR codes (충전), search users, and read the audit trail. Refunds are NOT here — they belong to the booth operator in `apps/pos`.

## Run

- Dev: `pnpm dev` (port 3003)
- Build: `pnpm build` (`next build`); lint: `pnpm lint` (root Biome config — no nested config)
- Env: copy `.env.example`. All config is server-side (no `NEXT_PUBLIC_`). Needs a registered DAuth client (`DAUTH_CLIENT_ID`) whose redirect URI matches `DAUTH_REDIRECT_URI` and the API's `DAUTH_ADMIN_REDIRECT_URI`. `BASE_API_URL` is the API URL; `BASE_INTERNAL_API_URL` (optional, falls back to `BASE_API_URL`) is used for server-to-server calls.

## Structure (FSD + App Router)

- `src/app/` — routes + route handlers. Import direction `shared → entities → features → widgets → app`. Alias `@/*`. Relative imports keep the `.ts`/`.tsx` extension.
- Auth: DAuth Authorization Code + PKCE, cloned from pos with `flick_admin_*` cookies. `GET /api/auth/login` starts the flow; `GET /api/auth/callback` exchanges the code via the API's `POST /v1/auth/admin`. Tokens are never exposed to client JS.
- `src/app/api/proxy/[...path]` — same-origin proxy that injects the bearer cookie and refreshes on 401 (via `rotateSession`, the single write-path helper). The `ky` client targets `/api/proxy`.

## Admin gate (two layers, defense-in-depth)

- `src/proxy.ts` (Next 16 proxy, not middleware) does an optimistic redirect to `/login` when no session cookie is present, and sets an `x-pathname` request header for server components. Matcher excludes `login`/`api`/static/metadata. It never reads the DB or writes cookies (Next: cookie writes are only allowed in Route Handlers/Server Actions).
- `src/app/(protected)/layout.tsx` is a server component that calls the read-only DAL `getSessionState` (`shared/auth/me.ts`, memoized with React `cache()`). It returns `authenticated`/`expired`/`unauthenticated`: `unauthenticated` → `redirect('/login')`, `!isAdmin` → `redirect('/login?error=forbidden')`, and `expired` (access invalid but refresh cookie present) → `redirect('/api/auth/refresh?next=…')`. The DAL performs no cookie writes; token rotation happens only in Route Handlers (`/api/auth/refresh` and the `/api/proxy` on-401 path), which is why the earlier "Cookies can only be modified in a Server Action or Route Handler" crash is gone.
- Security is ultimately enforced by the API's `requireAdmin`; the front gate is UX + defense-in-depth. `isAdmin` is set directly in the DB (no env allowlist).

## Data & pagination

- List screens (users/orders/audit) use cursor (keyset) pagination via `shared/api/cursor.ts` (`useCursorQuery`) + `widgets/data-table` (declarative columns, handles loading/empty/error/load-more). The API returns `{ items, nextCursor }`.
- 충전 flow: scan user QR (`@zxing/browser`) or type the code → `POST /v1/user-codes/resolve` → confirm user → amount → `POST /v1/charges` (one `idempotencyKey` per resolve→charge session). No code-level fallbacks; the only fallback is manual code entry, still verified by the same resolve API.

## Design

- UI comes from **`@flick/ui`** (re-exported via `@/shared/ui`). Semantic tokens only — no `zinc-*`/hex. `globals.css` imports `@flick/ui/styles.css`. `next.config.ts` sets `transpilePackages: ["@flick/ui"]`.
- `@flick/ui` has no table component; `widgets/data-table` is admin-local, built only from `@flick/ui` tokens/components, promotable to `@flick/ui` if another app needs it.

## Notes

- TS config extends `@flick/typescript-config/nextjs.json`. No nested lockfile/workspace/biome config — use the repo root.
