import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { type AuthVariables, requireAuth } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { booths, products } from "../db/schema/index.ts";
import { ForbiddenError, NotFoundError } from "../lib/errors.ts";

const productPatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  status: z.enum(["available", "hidden"]).optional(),
  sortOrder: z.number().int().optional(),
});

export const productsRoutes = new Hono<{ Variables: AuthVariables }>();

productsRoutes.patch(
  "/:id",
  requireAuth,
  zValidator("json", productPatchSchema),
  async (c) => {
    const productId = c.req.param("id") as string;
    const [product] = await getDb()
      .select({ product: products, booth: booths })
      .from(products)
      .innerJoin(booths, eq(products.boothId, booths.id))
      .where(eq(products.id, productId));
    if (!product) {
      throw new NotFoundError("product not found");
    }
    const user = c.get("user");
    if (!user.isAdmin && product.booth.ownerId !== user.id) {
      throw new ForbiddenError();
    }
    const [row] = await getDb()
      .update(products)
      .set({ ...c.req.valid("json"), updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();
    return c.json(row);
  },
);
