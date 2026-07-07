import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { type AuthVariables, requireAuth } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { booths, products } from "../db/schema/index.ts";
import { ForbiddenError, NotFoundError } from "../lib/errors.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import { productSchema } from "../openapi/schemas.ts";

const productPatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  status: z.enum(["available", "hidden"]).optional(),
  sortOrder: z.number().int().optional(),
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
      params: z.object({ id: z.string() }),
      body: {
        content: { "application/json": { schema: productPatchSchema } },
      },
    },
    responses: {
      200: jsonContent(productSchema, "Updated product"),
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
    const [row] = await getDb()
      .update(products)
      .set({ ...c.req.valid("json"), updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();
    if (!row) {
      throw new NotFoundError("product not found");
    }
    return c.json(row, 200);
  },
);

productsRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["products"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: z.object({ id: z.string() }) },
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
    return c.body(null, 204);
  },
);
