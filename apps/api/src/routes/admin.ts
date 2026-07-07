import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { type AuthVariables, requireAdmin } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { auditLogs, booths, orders, users } from "../db/schema/index.ts";
import {
  createdAtMicrosColumn,
  decodeCursor,
  encodeCursor,
  keysetCondition,
  parseLimit,
} from "../lib/pagination.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  adminOrderPageSchema,
  adminUserPageSchema,
  auditLogPageSchema,
} from "../openapi/schemas.ts";

const paginationQuery = {
  limit: z.string().optional(),
  cursor: z.string().optional(),
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function nextCursorFrom<T extends { createdAtMicros: string; id: string }>(
  rows: T[],
  limit: number,
): string | null {
  if (rows.length < limit) {
    return null;
  }
  const last = rows[rows.length - 1];
  if (!last) {
    return null;
  }
  return encodeCursor({ createdAtMicros: last.createdAtMicros, id: last.id });
}

export const adminRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

adminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/users",
    tags: ["admin"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: {
      query: z.object({ q: z.string().optional(), ...paginationQuery }),
    },
    responses: {
      200: jsonContent(adminUserPageSchema, "Users"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
    },
  }),
  async (c) => {
    const query = c.req.valid("query");
    const limit = parseLimit(query.limit);
    const cursor = decodeCursor(query.cursor);
    const term = query.q?.normalize("NFC").trim();

    const conditions: SQL[] = [];
    if (term) {
      const pattern = `%${escapeLike(term)}%`;
      const search = or(
        ilike(users.name, pattern),
        ilike(users.studentNumber, pattern),
      );
      if (search) {
        conditions.push(search);
      }
    }
    if (cursor) {
      conditions.push(keysetCondition(users.createdAt, users.id, cursor));
    }

    const rows = await getDb()
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
        roles: users.roles,
        isAdmin: users.isAdmin,
        studentNumber: users.studentNumber,
        balance: users.balance,
        createdAt: users.createdAt,
        createdAtMicros: createdAtMicrosColumn(users.createdAt),
      })
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(limit);

    const items = rows.map(({ createdAtMicros, ...user }) => user);
    return c.json({ items, nextCursor: nextCursorFrom(rows, limit) }, 200);
  },
);

adminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/orders",
    tags: ["admin"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: {
      query: z.object({
        status: z
          .enum(["pending", "paid", "canceled", "expired", "refunded"])
          .optional(),
        boothId: z.string().uuid().optional(),
        ...paginationQuery,
      }),
    },
    responses: {
      200: jsonContent(adminOrderPageSchema, "Orders"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
    },
  }),
  async (c) => {
    const query = c.req.valid("query");
    const limit = parseLimit(query.limit);
    const cursor = decodeCursor(query.cursor);

    const conditions: SQL[] = [];
    if (query.status) {
      conditions.push(eq(orders.status, query.status));
    }
    if (query.boothId) {
      conditions.push(eq(orders.boothId, query.boothId));
    }
    if (cursor) {
      conditions.push(keysetCondition(orders.createdAt, orders.id, cursor));
    }

    const rows = await getDb()
      .select({
        id: orders.id,
        boothId: orders.boothId,
        kioskId: orders.kioskId,
        buyerId: orders.buyerId,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paidAt: orders.paidAt,
        canceledAt: orders.canceledAt,
        refundedAt: orders.refundedAt,
        createdAt: orders.createdAt,
        boothName: booths.name,
        buyerName: users.name,
        createdAtMicros: createdAtMicrosColumn(orders.createdAt),
      })
      .from(orders)
      .innerJoin(booths, eq(orders.boothId, booths.id))
      .leftJoin(users, eq(orders.buyerId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(limit);

    const items = rows.map(({ createdAtMicros, ...order }) => order);
    return c.json({ items, nextCursor: nextCursorFrom(rows, limit) }, 200);
  },
);

adminRoutes.openapi(
  createRoute({
    method: "get",
    path: "/audit-logs",
    tags: ["admin"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: {
      query: z.object({
        action: z.string().optional(),
        actorId: z.string().uuid().optional(),
        targetType: z.string().optional(),
        ...paginationQuery,
      }),
    },
    responses: {
      200: jsonContent(auditLogPageSchema, "Audit logs"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
    },
  }),
  async (c) => {
    const query = c.req.valid("query");
    const limit = parseLimit(query.limit);
    const cursor = decodeCursor(query.cursor);

    const conditions: SQL[] = [];
    if (query.action) {
      conditions.push(eq(auditLogs.action, query.action));
    }
    if (query.actorId) {
      conditions.push(eq(auditLogs.actorId, query.actorId));
    }
    if (query.targetType) {
      conditions.push(eq(auditLogs.targetType, query.targetType));
    }
    if (cursor) {
      conditions.push(
        keysetCondition(auditLogs.createdAt, auditLogs.id, cursor),
      );
    }

    const rows = await getDb()
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorName: users.name,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        createdAtMicros: createdAtMicrosColumn(auditLogs.createdAt),
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.actorId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit);

    const items = rows.map(({ createdAtMicros, ...log }) => log);
    return c.json({ items, nextCursor: nextCursorFrom(rows, limit) }, 200);
  },
);
