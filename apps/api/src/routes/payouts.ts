import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { desc, eq } from "drizzle-orm";
import {
  type AuthVariables,
  requireAdmin,
  requireAuth,
} from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { type Payout, payouts, users } from "../db/schema/index.ts";
import { BASE_GRANT_AMOUNT } from "../lib/constants.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  adminPayoutSchema,
  payoutAccountSchema,
  payoutSummarySchema,
} from "../openapi/schemas.ts";

const payoutBodySchema = z.object({
  bankName: z.string().min(1).max(64),
  accountNumber: z.string().min(1).max(64),
  accountHolder: z.string().min(1).max(64),
});

function payableBalance(balance: number): number {
  return Math.max(0, balance - BASE_GRANT_AMOUNT);
}

async function userBalance(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ balance: users.balance })
    .from(users)
    .where(eq(users.id, userId));
  return row?.balance ?? 0;
}

function payoutAccount(row: Payout) {
  return {
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    accountHolder: row.accountHolder,
  };
}

export const payoutsRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

payoutsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/users/me/payout",
    tags: ["payouts"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: {
      200: jsonContent(payoutSummarySchema, "Payout summary"),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const [existing] = await getDb()
      .select()
      .from(payouts)
      .where(eq(payouts.userId, user.id))
      .limit(1);
    const availableAmount = payableBalance(await userBalance(user.id));
    return c.json(
      {
        availableAmount,
        account: existing ? payoutAccount(existing) : null,
      },
      200,
    );
  },
);

payoutsRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/users/me/payout",
    tags: ["payouts"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      body: { content: { "application/json": { schema: payoutBodySchema } } },
    },
    responses: {
      200: jsonContent(payoutAccountSchema, "Saved payout account"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const [row] = await getDb()
      .insert(payouts)
      .values({
        userId: user.id,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountHolder: body.accountHolder,
      })
      .onConflictDoUpdate({
        target: payouts.userId,
        set: {
          bankName: body.bankName,
          accountNumber: body.accountNumber,
          accountHolder: body.accountHolder,
        },
      })
      .returning();
    if (!row) {
      throw new Error("failed to save payout account");
    }
    return c.json(payoutAccount(row), 200);
  },
);

payoutsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/payouts",
    tags: ["payouts"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    responses: {
      200: jsonContent(z.array(adminPayoutSchema), "Payouts"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
    },
  }),
  async (c) => {
    const rows = await getDb()
      .select({
        payout: payouts,
        balance: users.balance,
        name: users.name,
        studentNumber: users.studentNumber,
      })
      .from(payouts)
      .innerJoin(users, eq(payouts.userId, users.id))
      .orderBy(desc(payouts.createdAt));
    return c.json(
      rows.map((row) => ({
        id: row.payout.id,
        userId: row.payout.userId,
        name: row.name,
        studentNumber: row.studentNumber,
        availableAmount: payableBalance(row.balance),
        accountHolder: row.payout.accountHolder,
        bankName: row.payout.bankName,
        accountNumber: row.payout.accountNumber,
        createdAt: row.payout.createdAt,
      })),
      200,
    );
  },
);
