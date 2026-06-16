Flick — pnpm + Turborepo monorepo. Expo (React Native) app + Hono/Drizzle API.

## Rules

- **No comments in code.**
- Workspace deps use `workspace:*`; shared TS config via `extends: "@flick/typescript-config/<preset>.json"` (base/expo/node/react-library/nextjs).
- Single root lockfile; never add one inside a package.

## Workspace

- `apps/app` — Expo (React Native) app. See `apps/app/AGENTS.md`.
- `apps/api` — Hono + Drizzle (PostgreSQL) API. See `apps/api/AGENTS.md`.
- `packages/typescript-config` — shared `@flick/typescript-config` presets.

## Tooling & commands (from repo root)

Use these, not defaults: **pnpm** (not npm/yarn, Node 24), **Biome** (not ESLint/Prettier), **Turborepo**.

- Install: `pnpm install`
- Lint: `pnpm lint` (`biome check .`) — must pass before committing.
- Format + autofix: `pnpm format` (`biome check --write .`)
- Build / dev across workspaces: `pnpm build` / `pnpm dev`
