import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
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
import { ForbiddenError, NotFoundError } from "../lib/errors.ts";
import { createKioskPairing } from "./kiosks.ts";

const boothSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  status: z.enum(["available", "hidden"]).optional(),
  sortOrder: z.number().int().optional(),
});

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

export const boothsRoutes = new Hono<{ Variables: AuthVariables }>();

boothsRoutes.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const rows = user.isAdmin
    ? await getDb().select().from(booths).orderBy(desc(booths.createdAt))
    : await getDb()
        .select()
        .from(booths)
        .where(eq(booths.ownerId, user.id))
        .orderBy(desc(booths.createdAt));
  return c.json(rows);
});

boothsRoutes.post(
  "/",
  requireAuth,
  zValidator("json", boothSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const [row] = await getDb()
      .insert(booths)
      .values({ ...body, ownerId: user.id, status: "pending" })
      .returning();
    return c.json(row, 201);
  },
);

boothsRoutes.get("/:id/kiosks", requireAuth, async (c) => {
  const user = c.get("user");
  const boothId = c.req.param("id") as string;
  const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
  if (!owns && !user.isAdmin) {
    throw new ForbiddenError();
  }
  const rows = await getDb()
    .select()
    .from(kioskPairings)
    .where(eq(kioskPairings.boothId, boothId));
  return c.json(rows);
});

boothsRoutes.post(
  "/:id/kiosks",
  requireAuth,
  zValidator("json", z.object({ name: z.string().min(1) })),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.param("id") as string;
    const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
    if (!owns && !user.isAdmin) {
      throw new ForbiddenError();
    }
    const result = await createKioskPairing(
      boothId,
      user.id,
      c.req.valid("json").name,
    );
    return c.json(result, 201);
  },
);

boothsRoutes.patch(
  "/:id",
  requireAuth,
  zValidator("json", boothSchema.partial()),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.param("id") as string;
    const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
    if (!owns && !user.isAdmin) {
      throw new ForbiddenError();
    }
    const [row] = await getDb()
      .update(booths)
      .set({ ...c.req.valid("json"), updatedAt: new Date() })
      .where(eq(booths.id, boothId))
      .returning();
    return c.json(row);
  },
);

boothsRoutes.post("/:id/approve", requireAdmin, async (c) => {
  const user = c.get("user");
  const boothId = c.req.param("id") as string;
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
  return c.json(row);
});

boothsRoutes.post("/:id/reject", requireAdmin, async (c) => {
  const user = c.get("user");
  const boothId = c.req.param("id") as string;
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
  return c.json(row);
});

boothsRoutes.get("/:id/products", requireAuth, async (c) => {
  const boothId = c.req.param("id") as string;
  const rows = await getDb()
    .select()
    .from(products)
    .where(eq(products.boothId, boothId));
  return c.json(rows);
});

boothsRoutes.get("/:id/orders", requireAuth, async (c) => {
  const user = c.get("user");
  const boothId = c.req.param("id") as string;
  const { owns } = await requireBoothOwnerOrAdmin(user.id, boothId);
  if (!owns && !user.isAdmin) {
    throw new ForbiddenError();
  }
  const rows = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.boothId, boothId))
    .orderBy(desc(orders.createdAt));
  return c.json(rows);
});

boothsRoutes.post(
  "/:id/products",
  requireAuth,
  zValidator("json", productSchema),
  async (c) => {
    const user = c.get("user");
    const boothId = c.req.param("id") as string;
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
