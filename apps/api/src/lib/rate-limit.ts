import type { Context, Next } from "hono";
import { TooManyRequestsError } from "./errors.ts";
import { getRedis } from "./redis.ts";

const WINDOW_MS = 60_000;

const memory = new Map<string, { count: number; resetAt: number }>();

function clientKey(c: Context, keyPrefix: string): string {
  const user = c.get("user") as { id?: string } | undefined;
  if (user?.id) {
    return `ratelimit:${keyPrefix}:user:${user.id}`;
  }
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || c.req.header("x-real-ip") || "unknown";
  return `ratelimit:${keyPrefix}:ip:${ip}`;
}

async function allowRedis(key: string, limit: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    return allowMemory(key, limit);
  }
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, WINDOW_MS);
    }
    return count <= limit;
  } catch (error) {
    console.error("rate limit: redis error, falling back to in-memory", error);
    return allowMemory(key, limit);
  }
}

function allowMemory(key: string, limit: number): boolean {
  const now = Date.now();
  const hit = memory.get(key);
  if (!hit || hit.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (hit.count >= limit) {
    return false;
  }
  hit.count += 1;
  return true;
}

export function rateLimit(limit: number, keyPrefix: string) {
  return async (c: Context, next: Next) => {
    const key = clientKey(c, keyPrefix);
    const allowed = await allowRedis(key, limit);
    if (!allowed) {
      throw new TooManyRequestsError();
    }
    await next();
  };
}
