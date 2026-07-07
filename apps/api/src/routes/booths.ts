import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, desc, eq, isNull } from "drizzle-orm";
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
  orders,
  products,
} from "../db/schema/index.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  boothSchema,
  kioskPairingSchema,
  orderSchema,
  productSchema,
} from "../openapi/schemas.ts";
import {
  serializeBooth,
  serializeKioskPairing,
} from "../openapi/serializers.ts";
import { createKioskPairing } from "./kiosks.ts";

const boothBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const productBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().int().positive(),
  stock: z.number().int().min(0).nullable().optional(),
  status: z.enum(["available", "hidden"]).optional(),
  sortOrder: z.number().int().optional(),
});

const idParam = z.object({ id: z.string() });

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

boothsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    responses: {
      200: jsonContent(z.array(boothSchema), "Booths"),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const rows = user.isAdmin
      ? await getDb()
          .select()
          .from(booths)
          .where(isNull(booths.archivedAt))
          .orderBy(desc(booths.createdAt))
      : await getDb()
          .select()
          .from(booths)
          .where(and(eq(booths.ownerId, user.id), isNull(booths.archivedAt)))
          .orderBy(desc(booths.createdAt));
    return c.json(rows.map(serializeBooth), 200);
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      body: { content: { "application/json": { schema: boothBodySchema } } },
    },
    responses: {
      201: jsonContent(boothSchema, "Created booth"),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const [row] = await getDb()
      .insert(booths)
      .values({ ...body, ownerId: user.id, status: "pending" })
      .returning();
    if (!row) {
      throw new Error("failed to create booth");
    }
    return c.json(serializeBooth(row), 201);
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
      200: jsonContent(z.array(kioskPairingSchema), "Booth kiosk pairings"),
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
    const rows = await getDb()
      .select()
      .from(kioskPairings)
      .where(eq(kioskPairings.boothId, boothId));
    return c.json(rows.map(serializeKioskPairing), 200);
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
    method: "patch",
    path: "/{id}",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      params: idParam,
      body: {
        content: {
          "application/json": { schema: boothBodySchema.partial() },
        },
      },
    },
    responses: {
      200: jsonContent(boothSchema, "Updated booth"),
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
      .update(booths)
      .set({ ...c.req.valid("json"), updatedAt: new Date() })
      .where(eq(booths.id, boothId))
      .returning();
    if (!row) {
      throw new NotFoundError("booth not found");
    }
    return c.json(serializeBooth(row), 200);
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
      200: jsonContent(z.array(productSchema), "Booth products"),
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
          canSeeHidden ? undefined : eq(products.status, "available"),
        ),
      );
    return c.json(rows, 200);
  },
);

boothsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/{id}/orders",
    tags: ["booths"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(z.array(orderSchema), "Booth orders"),
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
    const rows = await getDb()
      .select()
      .from(orders)
      .where(eq(orders.boothId, boothId))
      .orderBy(desc(orders.createdAt));
    return c.json(rows, 200);
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
      201: jsonContent(productSchema, "Created product"),
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
      .insert(products)
      .values({ ...c.req.valid("json"), boothId })
      .returning();
    return c.json(row, 201);
  },
);
