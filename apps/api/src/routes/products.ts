import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { type AuthVariables, requireAuth } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { booths, products } from "../db/schema/index.ts";
import { MAX_PRODUCT_PRICE } from "../lib/constants.ts";
import { ForbiddenError, NotFoundError } from "../lib/errors.ts";
import { publishBoothEvent } from "../lib/events.ts";
import {
  loadProductOptions,
  optionsInputSchema,
  replaceProductOptions,
} from "../lib/product-options.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import { productWithOptionsSchema } from "../openapi/schemas.ts";

const productPatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().int().positive().max(MAX_PRODUCT_PRICE).optional(),
  stock: z.number().int().min(0).nullable().optional(),
  status: z.enum(["available", "soldout", "hidden"]).optional(),
  sortOrder: z.number().int().optional(),
  options: optionsInputSchema.optional(),
});

export const productsRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

productsRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    tags: ["products"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: { "application/json": { schema: productPatchSchema } },
      },
    },
    responses: {
      200: jsonContent(productWithOptionsSchema, "Updated product"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const productId = c.req.valid("param").id;
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
    const { options, ...productInput } = c.req.valid("json");
    const updated = await getDb().transaction(async (tx) => {
      const [row] = await tx
        .update(products)
        .set({ ...productInput, updatedAt: new Date() })
        .where(eq(products.id, productId))
        .returning();
      if (!row) {
        throw new NotFoundError("product not found");
      }
      const optionGroups =
        options !== undefined
          ? await replaceProductOptions(tx, productId, options)
          : ((await loadProductOptions(tx, [productId])).get(productId) ?? []);
      return { ...row, optionGroups };
    });
    await publishBoothEvent(updated.boothId, {
      type: "product.updated",
      productId: updated.id,
    });
    return c.json(updated, 200);
  },
);

productsRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["products"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      204: { description: "Archived product" },
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const productId = c.req.valid("param").id;
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
    await getDb()
      .update(products)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(products.id, productId));
    await publishBoothEvent(product.product.boothId, {
      type: "product.updated",
      productId,
    });
    return c.body(null, 204);
  },
);
