# apps/charge

Operator-only charge app: **Vite + React 19** SPA that runs inside the Dodam app WebView. An **admin** operator scans a student's QR code (or types the 6-digit code), confirms the student, and charges their balance. Phone-first, single screen, built for a fast scan → amount → charge → next loop. Navigation via `@b1nd/aid-kit`.

## Run

- Dev server: `pnpm dev` (`vite`, proxies `/v1` to the API on :3000)
- Mock dev (no API, no login): `pnpm dev:mock` (`VITE_MOCK=1`) — seeds tokens and an admin `users/me`, so it boots straight into the charge screen.
- Build: `pnpm build` (`tsc --noEmit && vite build`)
- Preview: `pnpm preview`

## Role & auth

- The charge endpoints `POST /v1/user-codes/resolve` and `POST /v1/charges` are **`requireAdmin`** on the API. This app is only usable by an operator whose account is `isAdmin` in the DB.
- Auth mirrors `apps/app`: the Dodam WebView passes `?token=` in the URL → exchanged via `POST /v1/auth/app` → session tokens stored under `flick:charge:*` localStorage keys → sent as `Bearer` on `/v1` calls; 401 triggers refresh.
- `features/auth-gate` adds an `unauthorized` state: a non-admin can sign in but sees "권한이 없어요" instead of the charge screen (checked via `me.isAdmin`). To test it in mock mode, flip `me.isAdmin` to `false` in `src/mocks/fixtures.ts`.

## QR

- `features/qr-scan` prefers the **native aid-kit `QR_SCAN`** bridge action when a real `window.ReactNativeWebView` is present; otherwise it falls back to an in-WebView camera via `@zxing/browser`. Manual 6-digit entry is always available. The bridge mock (`shared/lib/bridge-mock.ts`) answers `QR_SCAN` with a fake code so the native path is exercisable in `dev:mock`.

## Structure (FSD)

- `src/app/` — entry, providers, `@b1nd/aid-kit` Router, `styles/globals.css`.
- Layers under `src/`: `shared`, `entities`, `features`, `widgets`, `pages`. Import direction `shared → entities → features → widgets → pages → app`. Alias `@/*` → `./src/*`. Relative imports keep the `.ts`/`.tsx` extension.
- `widgets/charge-flow` is the whole product surface: scan → confirm → charge → done, with quick-amount presets, large-amount confirm, idempotency key per resolve, success haptic, and 403/404 error mapping.

## Design

- UI comes from **`@flick/ui`** (re-exported via `@/shared/ui`; `Screen` is app-local). Semantic tokens only — no `zinc-*`/`blue-*`/hex.
- `ThemeProvider` from `@flick/ui/theme` wraps the app; theme init + `theme-color` metas live in `index.html`/`vite.config.ts` like `apps/app`.

## Notes

- TS config extends `@flick/typescript-config/base.json` with `allowImportingTsExtensions`.
- Tailwind v4 via `@tailwindcss/vite`; `globals.css` imports `@flick/ui/styles.css` and `@source`s the package.
- Uses the root pnpm workspace + Biome; no nested lockfile/config.
