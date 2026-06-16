# apps/app

Expo (SDK 56, React Native) app with expo-router. Targets direct App Store / Play Store distribution.

## Run

- Dev server: `pnpm dev` (`expo start`)
- iOS / Android: `pnpm ios` / `pnpm android`
- Dependency health: `pnpm dlx expo-doctor`
- Verify production bundle: `pnpm exec expo export --platform ios`

## Structure (FSD + expo-router)

- `src/app/` — expo-router file-based routing; replaces FSD's `app`/`pages` layers. Keep route files thin.
- Other FSD layers (`shared`, `entities`, `features`, `widgets`) live under `src/` — create only when needed.
- Import alias: `@/*` → `./src/*`.

## Notes

- TS config extends `@flick/typescript-config/expo.json` (which extends `expo/tsconfig.base` — keep `customConditions: ["react-native"]` intact).
- Biome web-only a11y rules are disabled for RN.
