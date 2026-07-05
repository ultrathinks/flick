<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# apps/pos

Booth-operator management web app (Next.js 16 App Router + React 19). Operators register a booth, manage menus (products) and single-select options, and toggle sold-out during operation. Orders/payments happen on the kiosk, not here.

## Run

- Dev: `pnpm dev` (port 3002)
- Build: `pnpm build` (`next build`); lint: `pnpm lint` (uses the root Biome config — no nested config)
- Env: copy `.env.example`. All config is server-side (no `NEXT_PUBLIC_` — nothing is read in client components). Needs a registered DAuth client (`DAUTH_CLIENT_ID`) whose redirect URI matches `DAUTH_REDIRECT_URI` and the API's `DAUTH_POS_REDIRECT_URI`. `BASE_API_URL` is the API URL; `BASE_INTERNAL_API_URL` (optional, falls back to `BASE_API_URL`) is used for server-to-server calls so deployments behind NAT can reach the API over an internal address instead of the public domain.

## Structure (FSD + App Router)

- `src/app/` — routes + route handlers; replaces FSD `app`/`pages`. Import direction `shared → entities → features → widgets → app`. Alias `@/*`. Relative imports keep the `.ts`/`.tsx` extension (tsconfig enables `allowImportingTsExtensions`).
- Auth: DAuth Authorization Code + PKCE. `GET /api/auth/login` starts the flow (PKCE verifier/state in short-lived httpOnly cookies); `GET /api/auth/callback` exchanges the code via the API's `POST /v1/auth/dauth` and sets httpOnly session cookies. Tokens are never exposed to client JS.
- `src/app/api/proxy/[...path]` — same-origin proxy that injects the bearer cookie into Flick API calls and refreshes on 401. The client `ky` instance targets `/api/proxy`.

## Design

- UI comes from **`@flick/ui`** (re-exported via `@/shared/ui`). Use semantic tokens only — no `zinc-*`/hex. `globals.css` imports `@flick/ui/styles.css` and `@source`s the package.
- `layout.tsx` loads Pretendard + Tossface via CDN `<link>` and holds the no-flash theme-init script; `ThemeProvider` (`@flick/ui/theme`) wraps the tree. `next.config.ts` sets `transpilePackages: ["@flick/ui"]`.

## Notes

- TS config extends `@flick/typescript-config/nextjs.json`. No nested lockfile/workspace/biome config — use the repo root.
