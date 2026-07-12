import { sql } from "drizzle-orm";
import { Redis } from "ioredis";
import { loadConfig } from "../config.ts";
import { getDb } from "../db/index.ts";
import { logger } from "./logger.ts";
import { checkStorage } from "./storage.ts";

const RETRIES = 3;
const BACKOFF_MS = 1000;

async function withRetry(
  name: string,
  check: () => Promise<void>,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRIES; attempt += 1) {
    try {
      await check();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS));
      }
    }
  }
  const reason =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`preflight ${name} check failed: ${reason}`);
}

async function pingRedis(url: string): Promise<void> {
  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  try {
    await client.connect();
    await client.ping();
  } finally {
    client.disconnect();
  }
}

export async function runPreflight(): Promise<void> {
  const config = loadConfig();

  await withRetry("database", async () => {
    await getDb().execute(sql`select 1`);
  });

  await withRetry("redis", async () => {
    await pingRedis(config.REDIS_URL);
  });

  try {
    await checkStorage();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    logger.warn(`preflight: storage check failed (non-fatal): ${reason}`);
  }
}
