Flick — pnpm + Turborepo monorepo. Three web frontends (Vite + Next.js) + Hono/Drizzle API, sharing one design system.

## Rules

- **No comments in code.**
- Workspace deps use `workspace:*`; shared TS config via `extends: "@flick/typescript-config/<preset>.json"` (base/expo/node/react-library/nextjs).
- Single root lockfile; never add one inside a package.
- **UI uses `@flick/ui` only** — semantic tokens (`bg-surface`, `text-foreground`, `bg-brand`, `rounded-card`, `text-heading`…) and shared components. Do not hardcode raw color/scale literals (`zinc-*`, `slate-*`, `indigo-*`, `blue-*`, hex). Tokens are dark-mode aware; brand is `#3182f6`.

## Workspace

- `apps/app` — customer web app (Vite + React 19, `@b1nd/aid-kit` navigation). See `apps/app/AGENTS.md`.
- `apps/kiosk` — touch kiosk web app (Next.js 16). See `apps/kiosk/AGENTS.md`.
- `apps/pos` — booth-operator web app (Next.js 16). See `apps/pos/AGENTS.md`.
- `apps/api` — Hono + Drizzle (PostgreSQL) API. See `apps/api/AGENTS.md`.
- `packages/ui` — shared `@flick/ui` design system: token CSS (`@flick/ui/styles.css`), CVA components, theme provider (`@flick/ui/theme`), Storybook catalog.
- `packages/typescript-config` — shared `@flick/typescript-config` presets.

## Tooling & commands (from repo root)

Use these, not defaults: **pnpm** (not npm/yarn, Node 24), **Biome** (not ESLint/Prettier), **Turborepo**.

- Install: `pnpm install`
- Lint: `pnpm lint` (`biome check .`) — must pass before committing.
- Format + autofix: `pnpm format` (`biome check --write .`)
- Build / dev across workspaces: `pnpm build` / `pnpm dev`
- Component catalog: `pnpm --filter @flick/ui storybook`
