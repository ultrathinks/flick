import "./otel.ts";
import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { loadConfig } from "./config.ts";
import { closePool } from "./db/index.ts";
import { closeEvents } from "./lib/events.ts";
import { logger } from "./lib/logger.ts";
import { runPreflight } from "./lib/preflight.ts";

let server: ReturnType<typeof serve> | undefined;
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info(`received ${signal}, shutting down`);
  try {
    if (server) {
      await Promise.race([
        new Promise<void>((resolve) => server?.close(() => resolve())),
        new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
      ]);
      (server as { closeAllConnections?: () => void }).closeAllConnections?.();
    }
    await closePool();
    await closeEvents();
  } catch (err) {
    logger.error({ err }, "error during shutdown");
  }
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandled rejection");
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaught exception");
  process.exit(1);
});

async function main(): Promise<void> {
  const config = loadConfig();
  await runPreflight();
  server = serve({ fetch: app.fetch, port: config.PORT }, (info) => {
    logger.info(`api listening on http://localhost:${info.port}`);
  });
}

main().catch((err) => {
  logger.error({ err }, "failed to start api");
  process.exit(1);
});
