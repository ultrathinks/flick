import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, isNull, sql } from "drizzle-orm";
import { type AuthVariables, requireAdmin } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import {
  auditLogs,
  orders,
  refunds,
  transactions,
  userCodes,
  users,
} from "../db/schema/index.ts";
import { BadRequestError, NotFoundError } from "../lib/errors.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { hashSecret } from "../lib/security.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  refundSchema,
  resolvedUserSchema,
  transactionSchema,
} from "../openapi/schemas.ts";

const resolveSchema = z.object({ code: z.string().min(1) });
const chargeSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive(),
  idempotencyKey: z.string().min(1),
});
const refundBodySchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().optional(),
});

export const moneyRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

moneyRoutes.openapi(
  createRoute({
    method: "post",
    path: "/user-codes/resolve",
    tags: ["money"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin, rateLimit(60, "user-codes:resolve")] as const,
    request: {
      body: { content: { "application/json": { schema: resolveSchema } } },
    },
    responses: {
      200: jsonContent(resolvedUserSchema, "Resolved user"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
      429: errorResponse("Too many requests"),
    },
  }),
  async (c) => {
    const { code } = c.req.valid("json");
    const [row] = await getDb()
      .select({ code: userCodes, user: users })
      .from(userCodes)
      .innerJoin(users, eq(userCodes.userId, users.id))
      .where(
        and(
          eq(userCodes.codeHash, hashSecret(code)),
          isNull(userCodes.revokedAt),
        ),
      )
      .limit(1);
    if (!row || row.code.expiresAt <= new Date()) {
      throw new NotFoundError("user code not found");
    }
    return c.json(
      {
        userId: row.user.id,
        name: row.user.name,
        roles: row.user.roles,
        studentNumber: row.user.studentNumber,
        balance: row.user.balance,
      },
      200,
    );
  },
);

moneyRoutes.openapi(
  createRoute({
    method: "post",
    path: "/charges",
    tags: ["money"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: {
      body: { content: { "application/json": { schema: chargeSchema } } },
    },
    responses: {
      201: jsonContent(transactionSchema, "Created charge"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const admin = c.get("user");
    const body = c.req.valid("json");
    const result = await getDb().transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.adminId, admin.id),
            eq(transactions.idempotencyKey, body.idempotencyKey),
          ),
        )
        .limit(1);
      if (existing) {
        return existing;
      }
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, body.userId));
      if (!user) {
        throw new NotFoundError("user not found");
      }
      const [transaction] = await tx
        .insert(transactions)
        .values({
          userId: body.userId,
          amount: body.amount,
          type: "charge",
          adminId: admin.id,
          idempotencyKey: body.idempotencyKey,
        })
        .returning();
      await tx
        .update(users)
        .set({
          balance: sql<number>`${users.balance} + ${body.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, body.userId));
      await tx.insert(auditLogs).values({
        actorId: admin.id,
        action: "charge.create",
        targetType: "user",
        targetId: body.userId,
        metadata: { amount: body.amount },
      });
      if (!transaction) {
        throw new Error("failed to create charge");
      }
      return transaction;
    });
    return c.json(result, 201);
  },
);

moneyRoutes.openapi(
  createRoute({
    method: "post",
    path: "/refunds",
    tags: ["money"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: {
      body: { content: { "application/json": { schema: refundBodySchema } } },
    },
    responses: {
      201: jsonContent(refundSchema, "Created refund"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
    },
  }),
  async (c) => {
    const admin = c.get("user");
    const { orderId, reason } = c.req.valid("json");
    const result = await getDb().transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      if (order?.status !== "paid" || !order.buyerId) {
        throw new BadRequestError("order is not refundable");
      }
      const [purchase] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.orderId, orderId),
            eq(transactions.type, "purchase"),
          ),
        )
        .limit(1);
      if (!purchase) {
        throw new BadRequestError("purchase transaction not found");
      }
      const [refundTransaction] = await tx
        .insert(transactions)
        .values({
          userId: order.buyerId,
          amount: order.totalAmount,
          type: "refund",
          orderId,
          paymentId: purchase.paymentId,
          adminId: admin.id,
          refundedTransactionId: purchase.id,
        })
        .returning();
      if (!refundTransaction) {
        throw new Error("failed to create refund transaction");
      }
      await tx
        .update(users)
        .set({
          balance: sql<number>`${users.balance} + ${order.totalAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, order.buyerId));
      const [refund] = await tx
        .insert(refunds)
        .values({
          orderId,
          paymentTransactionId: purchase.id,
          refundTransactionId: refundTransaction.id,
          amount: order.totalAmount,
          reason,
          adminId: admin.id,
        })
        .returning();
      await tx
        .update(orders)
        .set({ status: "refunded", refundedAt: new Date() })
        .where(eq(orders.id, orderId));
      await tx.insert(auditLogs).values({
        actorId: admin.id,
        action: "refund.create",
        targetType: "order",
        targetId: orderId,
        metadata: { amount: order.totalAmount },
      });
      if (!refund) {
        throw new Error("failed to create refund");
      }
      return refund;
    });
    return c.json(result, 201);
  },
);
