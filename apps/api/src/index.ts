import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { closePool } from "./db/index.ts";
import { closeRedis } from "./lib/redis.ts";

function resolvePort(): number {
  const raw = process.env.PORT;
  if (raw === undefined) {
    return 3000;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT is invalid: ${raw}`);
  }
  return port;
}

const port = resolvePort();

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`received ${signal}, shutting down`);
  try {
    await Promise.race([
      new Promise<void>((resolve) => server.close(() => resolve())),
      new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
    ]);
    (server as { closeAllConnections?: () => void }).closeAllConnections?.();
    await closePool();
    await closeRedis();
  } catch (err) {
    console.error("error during shutdown", err);
  }
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("unhandled rejection", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaught exception", err);
  process.exit(1);
});
