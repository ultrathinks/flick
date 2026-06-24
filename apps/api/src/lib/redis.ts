import { Redis } from "ioredis";

let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client === undefined) {
    const url = process.env.REDIS_URL;
    client = url ? new Redis(url, { maxRetriesPerRequest: 2 }) : null;
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
  }
  client = undefined;
}
