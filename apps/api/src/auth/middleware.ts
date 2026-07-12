import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { getDb } from "../db/index.ts";
import type { Kiosk, User } from "../db/schema/index.ts";
import { kiosks } from "../db/schema/index.ts";
import {
  ForbiddenError,
  KioskRevokedError,
  UnauthorizedError,
} from "../lib/errors.ts";
import { hashSecret } from "../lib/security.ts";
import { verifyAccessToken } from "./session.ts";

export type AuthVariables = {
  user: User;
  kiosk: Kiosk;
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

export async function requireAdmin(
  c: Context<{ Variables: AuthVariables }>,
  next: Next,
) {
  await requireAuth(c, async () => undefined);
  if (!c.get("user").isAdmin) {
    throw new ForbiddenError();
  }
  await next();
}

export async function requireKiosk(
  c: Context<{ Variables: AuthVariables }>,
  next: Next,
) {
  const token = extractBearerToken(c);
  if (!token) {
    throw new UnauthorizedError();
  }
  const [row] = await getDb()
    .select()
    .from(kiosks)
    .where(eq(kiosks.tokenHash, hashSecret(token)))
    .limit(1);
  if (!row) {
    throw new UnauthorizedError();
  }
  if (row.revokedAt) {
    throw new KioskRevokedError();
  }
  c.set("kiosk", row);
  await next();
}
