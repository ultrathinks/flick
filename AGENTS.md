# AGENTS.md

Flick is a pnpm + Turborepo monorepo: an Expo (React Native) app and a Hono/Drizzle API.

## Project rules

- **No comments.** Do not write comments in code.

## Workspace

- `apps/app` — Expo (React Native) app. See `apps/app/AGENTS.md`.
- `apps/api` — Hono + Drizzle (PostgreSQL) backend.
- `packages/typescript-config` — shared `@flick/typescript-config` presets (base/expo/node/react-library/nextjs).

## Tooling (non-standard — use these, not the defaults)

- **pnpm** for package management (not npm/yarn). Node 24.
- **Biome** for lint + format (not ESLint/Prettier).
- **Turborepo** for task running.

## Commands (from repo root)

- Install: `pnpm install`
- Lint: `pnpm lint` — must pass before committing.
- Format + autofix: `pnpm format`
- Build / dev across workspaces: `pnpm build` / `pnpm dev`

## Conventions

- Workspace deps use `workspace:*`; shared TS config via `extends: "@flick/typescript-config/<preset>.json"`.
- Single root lockfile; never add a lockfile inside a package.
