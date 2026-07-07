import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, sql } from "drizzle-orm";
import {
  type AuthVariables,
  requireAdmin,
  requireAuth,
} from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import {
  auditLogs,
  booths,
  orderItems,
  orders,
  products,
  refunds,
  transactions,
  users,
} from "../db/schema/index.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  refundSchema,
  resolvedUserSchema,
  transactionSchema,
} from "../openapi/schemas.ts";
import { serializeTransaction } from "../openapi/serializers.ts";

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
    const [user] = await getDb()
      .select()
      .from(users)
      .where(eq(users.code, code))
      .limit(1);
    if (!user) {
      throw new NotFoundError("user code not found");
    }
    return c.json(
      {
        userId: user.id,
        name: user.name,
        roles: user.roles,
        studentNumber: user.studentNumber,
        balance: user.balance,
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
    return c.json(serializeTransaction(result), 201);
  },
);

moneyRoutes.openapi(
  createRoute({
    method: "post",
    path: "/refunds",
    tags: ["money"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      body: { content: { "application/json": { schema: refundBodySchema } } },
    },
    responses: {
      201: jsonContent(refundSchema, "Created refund"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const actor = c.get("user");
    const { orderId, reason } = c.req.valid("json");
    const result = await getDb().transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      if (!order) {
        throw new NotFoundError("order not found");
      }
      const [booth] = await tx
        .select({ ownerId: booths.ownerId })
        .from(booths)
        .where(eq(booths.id, order.boothId));
      if (!booth || booth.ownerId !== actor.id) {
        throw new ForbiddenError();
      }
      if (order.status !== "paid" || !order.buyerId) {
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
          adminId: actor.id,
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
          adminId: actor.id,
        })
        .returning();
      const refundedItems = await tx
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
      for (const item of refundedItems) {
        await tx
          .update(products)
          .set({ stock: sql<number>`${products.stock} + ${item.quantity}` })
          .where(
            and(
              eq(products.id, item.productId),
              sql`${products.stock} is not null`,
            ),
          );
      }
      await tx
        .update(orders)
        .set({ status: "refunded", refundedAt: new Date() })
        .where(eq(orders.id, orderId));
      await tx.insert(auditLogs).values({
        actorId: actor.id,
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
