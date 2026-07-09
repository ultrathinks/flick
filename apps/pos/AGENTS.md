<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# apps/pos

Booth-operator management web app (Next.js 16 App Router + React 19). Operators register a booth, manage menus (products) with their option groups/values (single- or multi-select, priced) inline in one create/edit modal, and toggle sold-out during operation. Product base price is capped at 3,000 won. Orders/payments happen on the kiosk, not here.

## Run

- Dev: `pnpm dev` (port 3002)
- Build: `pnpm build` (`next build`); lint: `pnpm lint` (uses the root Biome config — no nested config)
- Env: copy `.env.example`. All config is server-side (no `NEXT_PUBLIC_` — nothing is read in client components). Needs a registered DAuth client (`DAUTH_CLIENT_ID`) whose redirect URI matches `DAUTH_REDIRECT_URI` and the API's `DAUTH_POS_REDIRECT_URI`. `BASE_API_URL` is the API URL; `BASE_INTERNAL_API_URL` (optional, falls back to `BASE_API_URL`) is used for server-to-server calls so deployments behind NAT can reach the API over an internal address instead of the public domain.

## Structure (FSD + App Router)

- `src/app/` — routes + route handlers; replaces FSD `app`/`pages`. Import direction `shared → entities → features → widgets → app`. Alias `@/*`. Relative imports keep the `.ts`/`.tsx` extension (tsconfig enables `allowImportingTsExtensions`).
- Auth: DAuth Authorization Code + PKCE. `GET /api/auth/login` starts the flow (PKCE verifier/state in short-lived httpOnly cookies); `GET /api/auth/callback` exchanges the code via the API's `POST /v1/auth/pos` and sets httpOnly session cookies. Tokens are never exposed to client JS.
- `src/app/api/proxy/[...path]` — same-origin proxy that injects the bearer cookie into Flick API calls and refreshes on 401 (via `rotateSession`, the single write-path helper). The client `ky` instance targets `/api/proxy`.
- Gating mirrors admin: `src/proxy.ts` does an optimistic `/login` redirect when no session cookie is present and sets an `x-pathname` request header; `src/app/(protected)/layout.tsx` is a server component calling the read-only DAL `getSessionState` (`shared/auth/me.ts`, memoized with React `cache()`) that returns `authenticated`/`expired`/`unauthenticated` — `unauthenticated` → `/login`, `expired` → `/api/auth/refresh?next=…`. Cookie writes (token rotation) happen only in Route Handlers. Booth resolution/onboarding and the locked-tab UI still live in the client `BoothScreen` widget.

## Design

- UI comes from **`@flick/ui`** (re-exported via `@/shared/ui`). Use semantic tokens only — no `zinc-*`/hex. `globals.css` imports `@flick/ui/styles.css` and `@source`s the package.
- `layout.tsx` loads Pretendard + Tossface via CDN `<link>` and holds the no-flash theme-init script; `ThemeProvider` (`@flick/ui/theme`) wraps the tree. `next.config.ts` sets `transpilePackages: ["@flick/ui"]`.

## Mock mode & tests

- **Mock dev**: `pnpm dev:mock` runs the app fully mocked, no API server and no login — gated by `NEXT_PUBLIC_MOCK=1` (the script also injects dummy `BASE_*`/`DAUTH_*` so `.env` isn't needed). MSW handlers live in `src/mocks/`: `handlers.ts` exports `createHandlers(base)` (single source of truth). Every browser `ky` call hits the same-origin `/api/proxy/*` route, which forwards server-side to `BASE_INTERNAL_API_URL`; that forward and the RSC `getSessionState` fetch are what MSW intercepts, via the Node server (`node.ts`, started from `instrumentation.ts`) mounted at `BASE_INTERNAL_API_URL`. There is no browser Service Worker — the server proxy already covers all client traffic, so mocking only needs the Node layer. `next.config.ts` marks `msw`/`@mswjs/interceptors` as `serverExternalPackages`.
- **Auth gate in mock mode**: the three cookie gates (`proxy.ts`, `(protected)/layout.tsx`, proxy route) check for a session cookie before any fetch. Visit `GET /api/mock/seed` once (flag-gated; 404 when the flag is off) — it seeds fake `flick_pos_*` cookies and redirects to `/`. No production auth/proxy code is touched.
- **Unit/integration tests**: `pnpm test` (`vitest run`). Config: `vitest.config.ts` (jsdom + `@vitejs/plugin-react`), `vitest.setup.ts` (starts `src/mocks/server.ts` — the handlers mounted at both `/api/proxy` and `BASE_INTERNAL_API_URL` — with `beforeAll/afterEach/afterAll`, stubs `matchMedia`, and restores relative-URL resolution for `ky`). Shared render helper: `src/test/render.tsx`. Vitest cannot render async Server Components, so tests cover client components/widgets, hooks, and entity API + route-handler logic through MSW — not `(protected)/layout.tsx` or the DAL.
- **E2E tests**: `pnpm test:e2e` (`playwright test`, Chromium). `playwright.config.ts` boots `pnpm dev:mock` as its `webServer`; specs live in `e2e/`. `e2e/fixtures.ts` extends `page` to hit `/api/mock/seed` first, so authed specs start signed in. E2E covers what Vitest can't: the async Server Component gate + full navigation flow over the mocked backend.

## Notes

- TS config extends `@flick/typescript-config/nextjs.json`. No nested lockfile/workspace/biome config — use the repo root. Test tooling (`vitest`, `vite`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/*`, `msw`) is a pos-local devDependency; it never ships in the Next runtime.
