# apps/app

Customer-facing web app: **Vite + React 19** SPA (not Expo/React Native). Runs inside the Dodam app WebView; balance, charge codes, and booth payments. Navigation via `@b1nd/aid-kit`.

## Run

- Dev server: `pnpm dev` (`vite`, proxies `/v1` to the API on :3000)
- Build: `pnpm build` (`tsc --noEmit && vite build`)
- Preview: `pnpm preview`

## Structure (FSD)

- `src/app/` — app entry, providers, routes (`@b1nd/aid-kit` Router), `styles/globals.css`.
- FSD layers under `src/`: `shared`, `entities`, `features`, `widgets`, `pages`. Import direction `shared → entities → features → widgets → pages → app`.
- Import alias: `@/*` → `./src/*`. Relative imports keep the `.ts`/`.tsx` extension.

## Design

- UI comes from **`@flick/ui`** (re-exported via `@/shared/ui`; `Screen` is app-local). Use semantic tokens only — no `zinc-*`/`blue-*`/hex.
- Fonts (Pretendard + Tossface) load via CDN `<link>` in `index.html`, which also holds the no-flash theme-init script; `theme-color` metas cover light/dark.
- `ThemeProvider` from `@flick/ui/theme` wraps the app; the theme toggle lives on the profile page.

## Notes

- TS config extends `@flick/typescript-config/base.json` with `allowImportingTsExtensions`.
- Tailwind v4 via `@tailwindcss/vite`; `globals.css` imports `@flick/ui/styles.css` and `@source`s the package.
