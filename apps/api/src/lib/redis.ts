import { Redis } from "ioredis";
import { isProduction } from "../config.ts";

let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client === undefined) {
    const url = process.env.REDIS_URL;
    if (!url) {
      if (isProduction()) {
        throw new Error("REDIS_URL is required in production");
      }
      client = null;
    } else {
      client = new Redis(url, { maxRetriesPerRequest: 2 });
    }
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
  }
  client = undefined;
}
