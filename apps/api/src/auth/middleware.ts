import type { Context, Next } from "hono";
import type { User } from "../db/schema/index.ts";
import { UnauthorizedError } from "../lib/errors.ts";
import { verifyAccessToken } from "./session.ts";

export type AuthVariables = {
  user: User;
};

export function extractBearerToken(c: Context): string | null {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

export async function requireAuth(
  c: Context<{ Variables: AuthVariables }>,
  next: Next,
) {
  const token = extractBearerToken(c);
  if (!token) {
    throw new UnauthorizedError();
  }

  const user = await verifyAccessToken(token);
  if (!user) {
    throw new UnauthorizedError();
  }

  c.set("user", user);
  await next();
}
