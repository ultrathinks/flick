# AGENTS.md — apps/app

Expo (SDK 56, React Native) app, built with expo-router. Targets direct App Store / Play Store distribution.

## Run

- Start dev server: `pnpm dev` (alias for `expo start`)
- iOS / Android: `pnpm ios` / `pnpm android`
- Check dependency health: `pnpm dlx expo-doctor`
- Production bundle (verify build): `pnpm exec expo export --platform ios`

## Structure (FSD + expo-router)

- Routing lives in `src/app/` (expo-router file-based routing). It replaces FSD's `app`/`pages` layers; keep route files thin.
- Other FSD layers (`shared`, `entities`, `features`, `widgets`) go under `src/` — create them only when actually needed.
- Import alias: `@/*` → `./src/*`.

## Notes

- TypeScript config extends `@flick/typescript-config/expo.json` (which itself extends `expo/tsconfig.base` — keep `customConditions: ["react-native"]` intact).
- Lint/format is Biome from the repo root; web-only a11y rules are disabled for RN.
