import type { BoothEvent } from "@flick/contract";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  type SQL,
  sql,
} from "drizzle-orm";
import {
  type AuthVariables,
  requireAdmin,
  requireAuth,
} from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import {
  auditLogs,
  booths,
  kioskPairings,
  kiosks,
  orders,
  products,
} from "../db/schema/index.ts";
import { MAX_PRODUCT_PRICE } from "../lib/constants.ts";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors.ts";
import {
  publishAdminEvent,
  publishBoothEvent,
  subscribeBoothEvents,
} from "../lib/events.ts";
import {
  createdAtMicrosColumn,
  decodeCursor,
  encodeCursor,
  keysetCondition,
  parseLimit,
} from "../lib/pagination.ts";
import {
  loadProductOptions,
  optionsInputSchema,
  replaceProductOptions,
} from "../lib/product-options.ts";
import { channelEventStream } from "../lib/sse.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  boothKiosksSchema,
  boothOrderPageSchema,
  boothSalesSchema,
  boothSchema,
  kioskPairingSchema,
  productWithOptionsSchema,
} from "../openapi/schemas.ts";
import {
  serializeBooth,
  serializeKiosk,
  serializeKioskPairing,
} from "../openapi/serializers.ts";
import { createKioskPairing } from "./kiosks.ts";

const boothBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const productBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive().max(MAX_PRODUCT_PRICE),
  stock: z.number().int().min(0).nullable().optional(),
  status: z.enum(["available", "soldout", "hidden"]).optional(),
  sortOrder: z.number().int().optional(),
  options: optionsInputSchema.optional(),
});

const idParam = z.object({ id: z.string().uuid() });

async function requireBoothOwnerOrAdmin(userId: string, boothId: string) {
  const [booth] = await getDb()
    .select()
    .from(booths)
    .where(eq(booths.id, boothId));
  if (!booth) {
    throw new NotFoundError("booth not found");
  }
  const [userBooth] = await getDb()
    .select()
    .from(booths)
    .where(and(eq(booths.id, boothId), eq(booths.ownerId, userId)))
    .limit(1);
  return { booth, owns: Boolean(userBooth) };
}

export const boothsRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

boothsRoutes.get("/:id/events", requireAuth, async (c) => {
  const user = c.get("user");
  const boothId = c.req.param("id");
  if (!boothId) {
    throw new NotFoundError("booth not found");
  }
  const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
  if (!owns && !user.isAdmin) {
    throw new ForbiddenError();
  }
  return channelEventStream<BoothEvent>(c, {
    subscribe: (handler) => subscribeBoothEvents(boothId, handler),
  });
});

boothsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    responses: {
      200: jsonContent(z.array(boothSchema), "Booths"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
    },
  }),
  async (c) => {
    const rows = await getDb()
      .select()
      .from(booths)
      .where(isNull(booths.archivedAt))
      .orderBy(desc(booths.createdAt));
    return c.json(rows.map(serializeBooth), 200);
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{id}/kiosks",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(boothKiosksSchema, "Booth kiosks and pending pairings"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.valid("param").id;
    const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
    if (!owns && !user.isAdmin) {
      throw new ForbiddenError();
    }
    const now = new Date();
    const deviceRows = await getDb()
      .select()
      .from(kiosks)
      .where(and(eq(kiosks.boothId, boothId), isNull(kiosks.revokedAt)))
      .orderBy(desc(kiosks.createdAt));
    const pendingRows = await getDb()
      .select()
      .from(kioskPairings)
      .where(
        and(
          eq(kioskPairings.boothId, boothId),
          isNull(kioskPairings.claimedAt),
          gt(kioskPairings.expiresAt, now),
        ),
      )
      .orderBy(desc(kioskPairings.createdAt));
    return c.json(
      {
        devices: deviceRows.map(serializeKiosk),
        pending: pendingRows.map(serializeKioskPairing),
      },
      200,
    );
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{id}/kiosks",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      params: idParam,
      body: {
        content: {
          "application/json": { schema: z.object({ name: z.string().min(1) }) },
        },
      },
    },
    responses: {
      201: jsonContent(
        z.object({ pairing: kioskPairingSchema, code: z.string() }),
        "Created kiosk pairing",
      ),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.valid("param").id;
    const { booth, owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
    if (!owns && !user.isAdmin) {
      throw new ForbiddenError();
    }
    if (booth.status !== "approved") {
      throw new BadRequestError("booth is not approved");
    }
    const result = await createKioskPairing(
      boothId,
      user.id,
      c.req.valid("json").name,
    );
    return c.json(
      { pairing: serializeKioskPairing(result.pairing), code: result.code },
      201,
    );
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{id}/approve",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(boothSchema, "Approved booth"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.valid("param").id;
    const [row] = await getDb()
      .update(booths)
      .set({ status: "approved", approvedBy: user.id, approvedAt: new Date() })
      .where(eq(booths.id, boothId))
      .returning();
    if (!row) {
      throw new NotFoundError("booth not found");
    }
    await getDb().insert(auditLogs).values({
      actorId: user.id,
      action: "booth.approve",
      targetType: "booth",
      targetId: boothId,
    });
    await publishBoothEvent(boothId, {
      type: "booth.approved",
      data: { boothId },
    });
    await publishAdminEvent({ type: "booth.approved", data: { boothId } });
    return c.json(row, 200);
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{id}/reject",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAdmin] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(boothSchema, "Rejected booth"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.valid("param").id;
    const [row] = await getDb()
      .update(booths)
      .set({ status: "rejected", approvedBy: user.id, approvedAt: new Date() })
      .where(eq(booths.id, boothId))
      .returning();
    if (!row) {
      throw new NotFoundError("booth not found");
    }
    await getDb().insert(auditLogs).values({
      actorId: user.id,
      action: "booth.reject",
      targetType: "booth",
      targetId: boothId,
    });
    await publishBoothEvent(boothId, {
      type: "booth.rejected",
      data: { boothId },
    });
    await publishAdminEvent({ type: "booth.rejected", data: { boothId } });
    return c.json(serializeBooth(row), 200);
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{id}/products",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(z.array(productWithOptionsSchema), "Booth products"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.valid("param").id;
    const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
    const canSeeHidden = owns || user.isAdmin;
    const rows = await getDb()
      .select()
      .from(products)
      .where(
        and(
          eq(products.boothId, boothId),
          isNull(products.archivedAt),
          canSeeHidden
            ? undefined
            : inArray(products.status, ["available", "soldout"]),
        ),
      )
      .orderBy(asc(products.sortOrder), asc(products.createdAt));
    const optionsByProduct = await loadProductOptions(
      getDb(),
      rows.map((product) => product.id),
    );
    return c.json(
      rows.map((product) => ({
        ...product,
        optionGroups: optionsByProduct.get(product.id) ?? [],
      })),
      200,
    );
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{id}/orders",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      params: idParam,
      query: z.object({
        limit: z.string().optional(),
        cursor: z.string().optional(),
      }),
    },
    responses: {
      200: jsonContent(boothOrderPageSchema, "Booth orders"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.valid("param").id;
    const query = c.req.valid("query");
    const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
    if (!owns && !user.isAdmin) {
      throw new ForbiddenError();
    }
    const limit = parseLimit(query.limit);
    const cursor = decodeCursor(query.cursor);
    const conditions: SQL[] = [eq(orders.boothId, boothId)];
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
        createdAtMicros: createdAtMicrosColumn(orders.createdAt),
      })
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(limit);
    const items = rows.map(({ createdAtMicros, ...order }) => order);
    const last = rows.at(-1);
    const nextCursor =
      rows.length === limit && last
        ? encodeCursor({ createdAtMicros: last.createdAtMicros, id: last.id })
        : null;
    return c.json({ items, nextCursor }, 200);
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{id}/sales",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(boothSalesSchema, "Booth sales summary"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.valid("param").id;
    const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
    if (!owns && !user.isAdmin) {
      throw new ForbiddenError();
    }
    const [row] = await getDb()
      .select({
        paidCount: sql<number>`count(*) filter (where ${orders.status} = 'paid')`,
        paidRevenue: sql<number>`coalesce(sum(${orders.totalAmount}) filter (where ${orders.status} = 'paid'), 0)`,
        refundedCount: sql<number>`count(*) filter (where ${orders.status} = 'refunded')`,
        refundedRevenue: sql<number>`coalesce(sum(${orders.totalAmount}) filter (where ${orders.status} = 'refunded'), 0)`,
      })
      .from(orders)
      .where(eq(orders.boothId, boothId));
    return c.json(
      {
        paidCount: Number(row?.paidCount ?? 0),
        paidRevenue: Number(row?.paidRevenue ?? 0),
        refundedCount: Number(row?.refundedCount ?? 0),
        refundedRevenue: Number(row?.refundedRevenue ?? 0),
      },
      200,
    );
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{id}/products",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      params: idParam,
      body: { content: { "application/json": { schema: productBodySchema } } },
    },
    responses: {
      201: jsonContent(productWithOptionsSchema, "Created product"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.valid("param").id;
    const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
    if (!owns && !user.isAdmin) {
      throw new ForbiddenError();
    }
    const { options, ...productInput } = c.req.valid("json");
    const created = await getDb().transaction(async (tx) => {
      const [row] = await tx
        .insert(products)
        .values({ ...productInput, boothId })
        .returning();
      if (!row) {
        throw new Error("failed to create product");
      }
      const optionGroups = options
        ? await replaceProductOptions(tx, row.id, options)
        : [];
      return { ...row, optionGroups };
    });
    await publishBoothEvent(boothId, {
      type: "product.updated",
      data: { productId: created.id },
    });
    return c.json(created, 201);
  },
);

export const myBoothRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

async function findMyBooth(userId: string) {
  const [row] = await getDb()
    .select()
    .from(booths)
    .where(and(eq(booths.ownerId, userId), isNull(booths.archivedAt)))
    .limit(1);
  return row ?? null;
}

myBoothRoutes.openapi(
  createRoute({
    method: "get",
    path: "/users/me/booth",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: {
      200: jsonContent(boothSchema, "My booth"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const row = await findMyBooth(user.id);
    if (!row) {
      throw new NotFoundError("booth not found");
    }
    return c.json(serializeBooth(row), 200);
  },
);

myBoothRoutes.openapi(
  createRoute({
    method: "post",
    path: "/users/me/booth",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      body: { content: { "application/json": { schema: boothBodySchema } } },
    },
    responses: {
      201: jsonContent(boothSchema, "Created booth"),
      401: errorResponse("Unauthorized"),
      409: errorResponse("Conflict"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const existing = await findMyBooth(user.id);
    if (existing) {
      throw new ConflictError("booth already exists");
    }
    const [row] = await getDb()
      .insert(booths)
      .values({ ...body, ownerId: user.id, status: "pending" })
      .returning();
    if (!row) {
      throw new Error("failed to create booth");
    }
    await publishAdminEvent({
      type: "booth.created",
      data: { boothId: row.id },
    });
    return c.json(serializeBooth(row), 201);
  },
);

myBoothRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/users/me/booth",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      body: {
        content: {
          "application/json": { schema: boothBodySchema.partial() },
        },
      },
    },
    responses: {
      200: jsonContent(boothSchema, "Updated booth"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const existing = await findMyBooth(user.id);
    if (!existing) {
      throw new NotFoundError("booth not found");
    }
    const [row] = await getDb()
      .update(booths)
      .set({ ...c.req.valid("json"), updatedAt: new Date() })
      .where(eq(booths.id, existing.id))
      .returning();
    if (!row) {
      throw new NotFoundError("booth not found");
    }
    return c.json(serializeBooth(row), 200);
  },
);
