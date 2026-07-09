import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { desc, eq, sql } from "drizzle-orm";
import {
  type AuthVariables,
  requireAdmin,
  requireAuth,
} from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import {
  auditLogs,
  type Payout,
  payouts,
  transactions,
  users,
} from "../db/schema/index.ts";
import { BASE_GRANT_AMOUNT } from "../lib/constants.ts";
import { ConflictError, NotFoundError } from "../lib/errors.ts";
import { maskAccountNumber } from "../lib/security.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  maskedPayoutSchema,
  payoutAccountSchema,
  payoutRequestSchema,
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

function maskedPayout(row: Payout, balance: number) {
  return {
    id: row.id,
    userId: row.userId,
    amount: row.amount,
    availableAmount: row.status === "requested" ? payableBalance(balance) : 0,
    status: row.status,
    accountHolder: row.accountHolder,
    bankName: row.bankName,
    accountNumber: maskAccountNumber(row.accountNumber),
    paidAt: row.paidAt,
    paidBy: row.paidBy,
    createdAt: row.createdAt,
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
      .orderBy(desc(payouts.createdAt))
      .limit(1);
    const availableAmount = payableBalance(await userBalance(user.id));
    return c.json(
      {
        availableAmount,
        request: existing
          ? {
              id: existing.id,
              status: existing.status,
              createdAt: existing.createdAt,
            }
          : null,
      },
      200,
    );
  },
);

payoutsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/users/me/payout",
    tags: ["payouts"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      body: { content: { "application/json": { schema: payoutBodySchema } } },
    },
    responses: {
      201: jsonContent(payoutRequestSchema, "Created payout request"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      409: errorResponse("Conflict"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const result = await getDb().transaction(async (tx) => {
      const [balanceRow] = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, user.id));
      if (payableBalance(balanceRow?.balance ?? 0) <= 0) {
        throw new ConflictError("no payable balance");
      }
      const [row] = await tx
        .insert(payouts)
        .values({
          userId: user.id,
          bankName: body.bankName,
          accountNumber: body.accountNumber,
          accountHolder: body.accountHolder,
        })
        .onConflictDoNothing()
        .returning();
      if (!row) {
        throw new ConflictError("payout already requested");
      }
      return row;
    });
    return c.json(
      {
        id: result.id,
        status: result.status,
        createdAt: result.createdAt,
      },
      201,
    );
  },
);

payoutsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/payouts",
    tags: ["payouts"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: {
      query: z.object({ status: z.string().optional() }),
    },
    responses: {
      200: jsonContent(z.array(maskedPayoutSchema), "Payouts"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
    },
  }),
  async (c) => {
    const status = c.req.valid("query").status;
    const rows = await getDb()
      .select({ payout: payouts, balance: users.balance })
      .from(payouts)
      .innerJoin(users, eq(payouts.userId, users.id))
      .orderBy(desc(payouts.createdAt));
    const filtered = status
      ? rows.filter((row) => row.payout.status === status)
      : rows;
    return c.json(
      filtered.map((row) => maskedPayout(row.payout, row.balance)),
      200,
    );
  },
);

payoutsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/payouts/{id}/account",
    tags: ["payouts"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: jsonContent(payoutAccountSchema, "Plain payout account"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const admin = c.get("user");
    const payoutId = c.req.valid("param").id;
    const [row] = await getDb()
      .select()
      .from(payouts)
      .where(eq(payouts.id, payoutId));
    if (!row) {
      throw new NotFoundError("payout not found");
    }
    await getDb().insert(auditLogs).values({
      actorId: admin.id,
      action: "payout.view_plain_account",
      targetType: "payout",
      targetId: payoutId,
    });
    return c.json(
      {
        bankName: row.bankName,
        accountNumber: row.accountNumber,
        accountHolder: row.accountHolder,
      },
      200,
    );
  },
);

payoutsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/payouts/{id}/pay",
    tags: ["payouts"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: jsonContent(maskedPayoutSchema, "Paid payout"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
      409: errorResponse("Conflict"),
    },
  }),
  async (c) => {
    const admin = c.get("user");
    const payoutId = c.req.valid("param").id;
    const result = await getDb().transaction(async (tx) => {
      const [payout] = await tx
        .select()
        .from(payouts)
        .where(eq(payouts.id, payoutId))
        .for("update");
      if (!payout) {
        throw new NotFoundError("payout not found");
      }
      if (payout.status !== "requested") {
        throw new ConflictError("payout is not requested");
      }
      const [payoutUser] = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, payout.userId))
        .for("update");
      const amount = payableBalance(payoutUser?.balance ?? 0);
      if (amount <= 0) {
        throw new ConflictError("no payable balance");
      }
      const [transaction] = await tx
        .insert(transactions)
        .values({
          userId: payout.userId,
          amount: -amount,
          type: "payout",
          adminId: admin.id,
        })
        .returning();
      if (!transaction) {
        throw new Error("failed to create payout transaction");
      }
      await tx
        .update(users)
        .set({
          balance: sql<number>`${users.balance} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, payout.userId));
      const [updated] = await tx
        .update(payouts)
        .set({
          amount,
          status: "paid",
          paidAt: new Date(),
          paidBy: admin.id,
          payoutTransactionId: transaction.id,
        })
        .where(eq(payouts.id, payoutId))
        .returning();
      await tx.insert(auditLogs).values({
        actorId: admin.id,
        action: "payout.pay",
        targetType: "payout",
        targetId: payoutId,
        metadata: { amount },
      });
      return updated;
    });
    if (!result) {
      throw new NotFoundError("payout not found");
    }
    return c.json(maskedPayout(result, 0), 200);
  },
);

payoutsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/payouts/{id}/reject",
    tags: ["payouts"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: jsonContent(maskedPayoutSchema, "Rejected payout"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
      409: errorResponse("Conflict"),
    },
  }),
  async (c) => {
    const admin = c.get("user");
    const payoutId = c.req.valid("param").id;
    const result = await getDb().transaction(async (tx) => {
      const [payout] = await tx
        .select()
        .from(payouts)
        .where(eq(payouts.id, payoutId))
        .for("update");
      if (!payout) {
        throw new NotFoundError("payout not found");
      }
      if (payout.status !== "requested") {
        throw new ConflictError("payout is not requested");
      }
      const [updated] = await tx
        .update(payouts)
        .set({ status: "rejected" })
        .where(eq(payouts.id, payoutId))
        .returning();
      await tx.insert(auditLogs).values({
        actorId: admin.id,
        action: "payout.reject",
        targetType: "payout",
        targetId: payoutId,
      });
      return updated;
    });
    if (!result) {
      throw new NotFoundError("payout not found");
    }
    return c.json(maskedPayout(result, 0), 200);
  },
);
