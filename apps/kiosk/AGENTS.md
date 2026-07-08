# apps/kiosk

Touch kiosk web app: **Vite + React 19** SPA. Targets landscape kiosk displays; customers browse a booth's menu, build a cart, and pay by scanning a QR with the Flick app.

## Run

- Dev server: `pnpm dev` (`vite`, port 3001, proxies `/v1` to the API on :3000)
- Dev with mock API: `pnpm dev:mock` (`VITE_MOCK=1`, MSW serves fixtures — no backend needed)
- Build: `pnpm build` (`tsc --noEmit && vite build`)
- Preview: `pnpm preview`

## Structure (FSD)

- `src/app/` — entry (`main.tsx`), `App.tsx` (react-router `BrowserRouter` + `useRoutes`), providers, routes, `styles/globals.css`, `error-boundary.tsx`.
- FSD layers under `src/`: `shared`, `entities`, `features`, `widgets`, `pages`. Import direction `shared → entities → features → widgets → pages → app`. A lower layer never imports a higher one.
- Import alias: `@/*` → `./src/*`. TS config extends `@flick/typescript-config/base.json` with `allowImportingTsExtensions`.
- Routing is declarative react-router; screens replace on session/flow transitions (no back stack). App state (session token, cart, payment snapshot) lives in `localStorage` via `shared/model/storage.ts`.

## Flow

`/` routes by session → `/pairing` (device pairing) → `/products` (menu + cart) → `/payment` (QR wait: SSE + poll fallback + countdown) → `/payment/complete` (auto-returns).

## Design

- UI comes from **`@flick/ui`** (re-exported via `@/shared/ui`). Use semantic tokens only — no `zinc-*`/`blue-*`/hex. Touch-first: prefer large sizes (`Button size="xl"|"lg"`, big typography). The product grid is responsive via `auto-fill minmax`.
- Fonts (Pretendard + Tossface) + no-flash theme-init script (`flick:theme`) + `theme-color` metas live in `index.html`.
- `ThemeProvider` from `@flick/ui/theme` plus `ToastProvider`/`ConfirmProvider` wrap the tree in `app/providers`.

## Mocking

- `src/mocks/` holds MSW handlers + fixtures; `dev:mock` starts the worker (`public/mockServiceWorker.js`). The payment SSE stream is emulated with a `text/event-stream` response that emits `completed` after a short delay.
- Pairing scenarios: code `EXPIRED` → 400, code `BUSY` → 429, any other code → success. Tune `AUTO_COMPLETE_MS` / `PAYMENT_EXPIRES_MS` in `handlers.ts` to exercise the completion, expiry, and urgent-timer states.
