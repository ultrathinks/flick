import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../db/index.ts";
import { sessions, type User, users } from "../db/schema/index.ts";

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_GRACE_TTL_MS = 30 * 1000;

export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = ACCESS_TOKEN_TTL_MS / 1000;

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueSession(userId: string): Promise<IssuedTokens> {
  const accessToken = generateToken();
  const refreshToken = generateToken();
  const now = Date.now();

  await getDb()
    .insert(sessions)
    .values({
      userId,
      accessTokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      accessTokenExpiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
      refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
    });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  };
}

export async function verifyAccessToken(token: string): Promise<User | null> {
  const rows = await getDb()
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.accessTokenHash, hashToken(token)),
        gt(sessions.accessTokenExpiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows[0]?.user ?? null;
}

export async function rotateRefresh(
  refreshToken: string,
): Promise<IssuedTokens | null> {
  const now = Date.now();
  const providedHash = hashToken(refreshToken);
  const newAccessToken = generateToken();
  const newRefreshToken = generateToken();

  const rotated = await getDb()
    .update(sessions)
    .set({
      accessTokenHash: hashToken(newAccessToken),
      refreshTokenHash: hashToken(newRefreshToken),
      accessTokenExpiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
      refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
      previousRefreshTokenHash: providedHash,
      previousRefreshTokenExpiresAt: new Date(now + REFRESH_GRACE_TTL_MS),
    })
    .where(
      and(
        eq(sessions.refreshTokenHash, providedHash),
        gt(sessions.refreshTokenExpiresAt, new Date()),
      ),
    )
    .returning({ id: sessions.id });

  if (rotated.length > 0) {
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  const graced = await getDb()
    .update(sessions)
    .set({
      accessTokenHash: hashToken(newAccessToken),
      refreshTokenHash: hashToken(newRefreshToken),
      accessTokenExpiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
      refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
      previousRefreshTokenHash: sessions.refreshTokenHash,
      previousRefreshTokenExpiresAt: new Date(now + REFRESH_GRACE_TTL_MS),
    })
    .where(
      and(
        eq(sessions.previousRefreshTokenHash, providedHash),
        gt(sessions.previousRefreshTokenExpiresAt, new Date()),
      ),
    )
    .returning({ id: sessions.id });

  if (graced.length === 0) {
    return null;
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  };
}

export async function revokeSession(accessToken: string): Promise<void> {
  await getDb()
    .delete(sessions)
    .where(eq(sessions.accessTokenHash, hashToken(accessToken)));
}
