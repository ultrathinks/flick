import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, sql } from "drizzle-orm";
import { type AuthVariables, requireAdmin } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { auditLogs, transactions, users } from "../db/schema/index.ts";
import { MAX_CHARGE_AMOUNT, MAX_TRANSACTION_AMOUNT } from "../lib/constants.ts";
import { isCheckViolation, isForeignKeyViolation } from "../lib/db-errors.ts";
import { BadRequestError, NotFoundError } from "../lib/errors.ts";
import { publishAdminEvent, publishUserEvent } from "../lib/events.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import { resolvedUserSchema, transactionSchema } from "../openapi/schemas.ts";
import { serializeTransaction } from "../openapi/serializers.ts";

const resolveSchema = z.object({ code: z.string().min(1) });
const chargeSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive().max(MAX_CHARGE_AMOUNT),
  idempotencyKey: z.string().min(1),
});
const adjustmentSchema = z.object({
  userId: z.string().uuid(),
  amount: z
    .number()
    .int()
    .gte(-MAX_TRANSACTION_AMOUNT)
    .lte(MAX_TRANSACTION_AMOUNT)
    .refine((value) => value !== 0, "amount must be non-zero"),
  reason: z.string().max(200).optional(),
  idempotencyKey: z.string().min(1),
});
export const moneyRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

moneyRoutes.openapi(
  createRoute({
    method: "post",
    path: "/user-codes/resolve",
    tags: ["money"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: {
      body: { content: { "application/json": { schema: resolveSchema } } },
    },
    responses: {
      200: jsonContent(resolvedUserSchema, "Resolved user"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
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
    try {
      const result = await getDb().transaction(async (tx) => {
        const [inserted] = await tx
          .insert(transactions)
          .values({
            userId: body.userId,
            amount: body.amount,
            type: "charge",
            adminId: admin.id,
            idempotencyKey: body.idempotencyKey,
          })
          .onConflictDoNothing()
          .returning();
        if (!inserted) {
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
          if (!existing) {
            throw new Error("charge conflict without an existing transaction");
          }
          return { transaction: existing, balance: null, replayed: true };
        }
        const [updatedUser] = await tx
          .update(users)
          .set({
            balance: sql<number>`${users.balance} + ${body.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, body.userId))
          .returning({ balance: users.balance });
        await tx.insert(auditLogs).values({
          actorId: admin.id,
          action: "charge.create",
          targetType: "user",
          targetId: body.userId,
          metadata: { amount: body.amount },
        });
        return {
          transaction: inserted,
          balance: updatedUser?.balance ?? null,
          replayed: false,
        };
      });
      if (!result.replayed && result.balance !== null) {
        await publishUserEvent(body.userId, {
          type: "balance.changed",
          data: { balance: result.balance },
        });
        await publishUserEvent(body.userId, {
          type: "transaction.created",
          data: { transactionId: result.transaction.id },
        });
        await publishAdminEvent({ type: "stats.changed", data: {} });
      }
      return c.json(serializeTransaction(result.transaction), 201);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new NotFoundError("user not found");
      }
      throw error;
    }
  },
);

moneyRoutes.openapi(
  createRoute({
    method: "post",
    path: "/adjustments",
    tags: ["money"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: {
      body: { content: { "application/json": { schema: adjustmentSchema } } },
    },
    responses: {
      201: jsonContent(transactionSchema, "Created adjustment"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const admin = c.get("user");
    const body = c.req.valid("json");
    try {
      const result = await getDb().transaction(async (tx) => {
        const [inserted] = await tx
          .insert(transactions)
          .values({
            userId: body.userId,
            amount: body.amount,
            type: "adjustment",
            adminId: admin.id,
            idempotencyKey: body.idempotencyKey,
          })
          .onConflictDoNothing()
          .returning();
        if (!inserted) {
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
          if (!existing) {
            throw new Error(
              "adjustment conflict without an existing transaction",
            );
          }
          return { transaction: existing, balance: null, replayed: true };
        }
        const [updatedUser] = await tx
          .update(users)
          .set({
            balance: sql<number>`${users.balance} + ${body.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, body.userId))
          .returning({ balance: users.balance });
        await tx.insert(auditLogs).values({
          actorId: admin.id,
          action: "adjustment.create",
          targetType: "user",
          targetId: body.userId,
          metadata: { amount: body.amount, reason: body.reason ?? null },
        });
        return {
          transaction: inserted,
          balance: updatedUser?.balance ?? null,
          replayed: false,
        };
      });
      if (!result.replayed && result.balance !== null) {
        await publishUserEvent(body.userId, {
          type: "balance.changed",
          data: { balance: result.balance },
        });
        await publishUserEvent(body.userId, {
          type: "transaction.created",
          data: { transactionId: result.transaction.id },
        });
        await publishAdminEvent({ type: "stats.changed", data: {} });
      }
      return c.json(serializeTransaction(result.transaction), 201);
    } catch (error) {
      if (isCheckViolation(error)) {
        throw new BadRequestError("adjustment would make balance negative");
      }
      if (isForeignKeyViolation(error)) {
        throw new NotFoundError("user not found");
      }
      throw error;
    }
  },
);
