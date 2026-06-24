import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { type AuthVariables, requireAuth } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { transactions, userCodes } from "../db/schema/index.ts";
import { USER_CODE_TTL_MS } from "../lib/constants.ts";
import {
  decryptText,
  encryptText,
  generateSecret,
  hashSecret,
} from "../lib/security.ts";

async function createUserCode(userId: string) {
  const code = generateSecret(24);
  const now = new Date();
  const expiresAt = new Date(Date.now() + USER_CODE_TTL_MS);
  const db = getDb();
  await db
    .update(userCodes)
    .set({ revokedAt: now, rotatedAt: now })
    .where(eq(userCodes.userId, userId));
  const [row] = await db
    .insert(userCodes)
    .values({
      userId,
      codeHash: hashSecret(code),
      codeEncrypted: encryptText(code),
      expiresAt,
    })
    .returning();
  if (!row) {
    throw new Error("failed to create user code");
  }
  return { code, expiresAt: row.expiresAt };
}

export const usersRoutes = new Hono<{ Variables: AuthVariables }>();

usersRoutes.get("/me", requireAuth, (c) => {
  const user = c.get("user");
  return c.json({
    id: user.id,
    username: user.username,
    name: user.name,
    profileImageUrl: user.profileImageUrl,
    roles: user.roles,
    isAdmin: user.isAdmin,
    studentNumber: user.studentNumber,
    balance: user.balance,
  });
});

usersRoutes.get("/me/transactions", requireAuth, async (c) => {
  const user = c.get("user");
  const rows = await getDb()
    .select()
    .from(transactions)
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.createdAt));
  return c.json(rows);
});

usersRoutes.get("/me/code", requireAuth, async (c) => {
  const user = c.get("user");
  const [row] = await getDb()
    .select()
    .from(userCodes)
    .where(eq(userCodes.userId, user.id))
    .orderBy(desc(userCodes.createdAt))
    .limit(1);
  if (row && !row.revokedAt && row.expiresAt > new Date()) {
    return c.json({
      code: decryptText(row.codeEncrypted),
      expiresAt: row.expiresAt,
    });
  }
  return c.json(await createUserCode(user.id));
});

usersRoutes.post("/me/code/rotate", requireAuth, async (c) => {
  return c.json(await createUserCode(c.get("user").id));
});
