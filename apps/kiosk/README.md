# kiosk

Flick kiosk web app — Vite + React 19 SPA (react-router) + Tailwind.

See `AGENTS.md` for structure and conventions.

## Run

```bash
pnpm dev        # dev server on :3001 (proxies /v1 to the API on :3000)
pnpm dev:mock   # dev server with a mock API (MSW) — no backend needed
pnpm build
pnpm lint
```
