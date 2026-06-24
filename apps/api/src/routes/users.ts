import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { desc, eq } from "drizzle-orm";
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
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  meSchema,
  transactionSchema,
  userCodeSchema,
} from "../openapi/schemas.ts";
import { serializeTransaction } from "../openapi/serializers.ts";

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

export const usersRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

usersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/me",
    tags: ["users"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: {
      200: jsonContent(meSchema, "Current user"),
      401: errorResponse("Unauthorized"),
    },
  }),
  (c) => {
    const user = c.get("user");
    return c.json(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        roles: user.roles,
        isAdmin: user.isAdmin,
        studentNumber: user.studentNumber,
        balance: user.balance,
      },
      200,
    );
  },
);

usersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/me/transactions",
    tags: ["users"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: {
      200: jsonContent(z.array(transactionSchema), "User transactions"),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const rows = await getDb()
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt));
    return c.json(rows.map(serializeTransaction), 200);
  },
);

usersRoutes.openapi(
  createRoute({
    method: "get",
    path: "/me/code",
    tags: ["users"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: {
      200: jsonContent(userCodeSchema, "Active user code"),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const [row] = await getDb()
      .select()
      .from(userCodes)
      .where(eq(userCodes.userId, user.id))
      .orderBy(desc(userCodes.createdAt))
      .limit(1);
    if (row && !row.revokedAt && row.expiresAt > new Date()) {
      return c.json(
        {
          code: decryptText(row.codeEncrypted),
          expiresAt: row.expiresAt,
        },
        200,
      );
    }
    return c.json(await createUserCode(user.id), 200);
  },
);

usersRoutes.openapi(
  createRoute({
    method: "post",
    path: "/me/code/rotate",
    tags: ["users"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: {
      200: jsonContent(userCodeSchema, "Rotated user code"),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    return c.json(await createUserCode(c.get("user").id), 200);
  },
);
