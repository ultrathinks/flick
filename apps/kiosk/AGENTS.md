# apps/kiosk

Kiosk web app on Next.js 16 (App Router) + React 19. Targets touch kiosk displays.

Next 16 differs from older versions — APIs, conventions, and file structure may not match what you know. Before writing Next-specific code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

## Structure (FSD + App Router)

- `src/app/` — App Router file-based routing; replaces FSD's `app`/`pages` layers. Keep route files thin (compose screens, no business logic).
- Other FSD layers live under `src/`: `shared`, `entities`, `features`, `widgets` — fill in as needed.
- Import direction is strict: `shared → entities → features → widgets → app`. A lower layer never imports from a higher one, and a layer never imports a sibling slice directly.
- Import alias: `@/*` → `./src/*`.
