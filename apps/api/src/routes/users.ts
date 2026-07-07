import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { desc, eq } from "drizzle-orm";
import { type AuthVariables, requireAuth } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { transactions } from "../db/schema/index.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  meSchema,
  transactionSchema,
  userCodeSchema,
} from "../openapi/schemas.ts";
import { serializeTransaction } from "../openapi/serializers.ts";

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
      200: jsonContent(userCodeSchema, "User code"),
      401: errorResponse("Unauthorized"),
    },
  }),
  (c) => {
    return c.json({ code: c.get("user").code }, 200);
  },
);
