import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { type AuthVariables, requireAuth } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import {
  booths,
  productOptionGroups,
  productOptionValues,
  products,
} from "../db/schema/index.ts";
import { ForbiddenError, NotFoundError } from "../lib/errors.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  productOptionGroupSchema,
  productOptionGroupWithValuesSchema,
  productOptionValueSchema,
} from "../openapi/schemas.ts";

const idParam = z.object({ id: z.string() });

const groupBodySchema = z.object({
  name: z.string().min(1),
  required: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const valueBodySchema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

async function requireProductOwner(productId: string) {
  const [row] = await getDb()
    .select({ product: products, booth: booths })
    .from(products)
    .innerJoin(booths, eq(products.boothId, booths.id))
    .where(eq(products.id, productId));
  if (!row) {
    throw new NotFoundError("product not found");
  }
  return row;
}

async function requireGroupOwner(groupId: string) {
  const [row] = await getDb()
    .select({
      group: productOptionGroups,
      booth: booths,
    })
    .from(productOptionGroups)
    .innerJoin(products, eq(productOptionGroups.productId, products.id))
    .innerJoin(booths, eq(products.boothId, booths.id))
    .where(eq(productOptionGroups.id, groupId));
  if (!row) {
    throw new NotFoundError("option group not found");
  }
  return row;
}

async function requireValueOwner(valueId: string) {
  const [row] = await getDb()
    .select({
      value: productOptionValues,
      booth: booths,
    })
    .from(productOptionValues)
    .innerJoin(
      productOptionGroups,
      eq(productOptionValues.groupId, productOptionGroups.id),
    )
    .innerJoin(products, eq(productOptionGroups.productId, products.id))
    .innerJoin(booths, eq(products.boothId, booths.id))
    .where(eq(productOptionValues.id, valueId));
  if (!row) {
    throw new NotFoundError("option value not found");
  }
  return row;
}

function assertOwns(
  booth: { ownerId: string },
  user: { id: string; isAdmin: boolean },
) {
  if (!user.isAdmin && booth.ownerId !== user.id) {
    throw new ForbiddenError();
  }
}

export const productOptionsRoutes = new OpenAPIHono<{
  Variables: AuthVariables;
}>();

productOptionsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/products/{id}/options",
    tags: ["product-options"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: idParam },
    responses: {
      200: jsonContent(
        z.array(productOptionGroupWithValuesSchema),
        "Product option groups",
      ),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const productId = c.req.valid("param").id;
    const [product] = await getDb()
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId));
    if (!product) {
      throw new NotFoundError("product not found");
    }
    const groups = await getDb()
      .select()
      .from(productOptionGroups)
      .where(
        and(
          eq(productOptionGroups.productId, productId),
          isNull(productOptionGroups.archivedAt),
        ),
      )
      .orderBy(asc(productOptionGroups.sortOrder));
    const groupIds = groups.map((group) => group.id);
    const values =
      groupIds.length > 0
        ? await getDb()
            .select()
            .from(productOptionValues)
            .where(
              and(
                inArray(productOptionValues.groupId, groupIds),
                isNull(productOptionValues.archivedAt),
              ),
            )
            .orderBy(asc(productOptionValues.sortOrder))
        : [];
    const valuesByGroup = new Map<string, typeof values>();
    for (const value of values) {
      const list = valuesByGroup.get(value.groupId) ?? [];
      list.push(value);
      valuesByGroup.set(value.groupId, list);
    }
    return c.json(
      groups.map((group) => ({
        ...group,
        values: valuesByGroup.get(group.id) ?? [],
      })),
      200,
    );
  },
);

productOptionsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/products/{id}/option-groups",
    tags: ["product-options"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      params: idParam,
      body: { content: { "application/json": { schema: groupBodySchema } } },
    },
    responses: {
      201: jsonContent(productOptionGroupSchema, "Created option group"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const productId = c.req.valid("param").id;
    const { booth } = await requireProductOwner(productId);
    assertOwns(booth, user);
    const [row] = await getDb()
      .insert(productOptionGroups)
      .values({ ...c.req.valid("json"), productId })
      .returning();
    if (!row) {
      throw new Error("failed to create option group");
    }
    return c.json(row, 201);
  },
);

productOptionsRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/option-groups/{id}",
    tags: ["product-options"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      params: idParam,
      body: {
        content: { "application/json": { schema: groupBodySchema.partial() } },
      },
    },
    responses: {
      200: jsonContent(productOptionGroupSchema, "Updated option group"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const groupId = c.req.valid("param").id;
    const { booth } = await requireGroupOwner(groupId);
    assertOwns(booth, user);
    const [row] = await getDb()
      .update(productOptionGroups)
      .set(c.req.valid("json"))
      .where(eq(productOptionGroups.id, groupId))
      .returning();
    if (!row) {
      throw new NotFoundError("option group not found");
    }
    return c.json(row, 200);
  },
);

productOptionsRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/option-groups/{id}",
    tags: ["product-options"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: idParam },
    responses: {
      204: { description: "Archived option group" },
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const groupId = c.req.valid("param").id;
    const { booth } = await requireGroupOwner(groupId);
    assertOwns(booth, user);
    const now = new Date();
    await getDb().transaction(async (tx) => {
      await tx
        .update(productOptionGroups)
        .set({ archivedAt: now })
        .where(eq(productOptionGroups.id, groupId));
      await tx
        .update(productOptionValues)
        .set({ archivedAt: now })
        .where(
          and(
            eq(productOptionValues.groupId, groupId),
            isNull(productOptionValues.archivedAt),
          ),
        );
    });
    return c.body(null, 204);
  },
);

productOptionsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/option-groups/{id}/values",
    tags: ["product-options"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      params: idParam,
      body: { content: { "application/json": { schema: valueBodySchema } } },
    },
    responses: {
      201: jsonContent(productOptionValueSchema, "Created option value"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const groupId = c.req.valid("param").id;
    const { booth } = await requireGroupOwner(groupId);
    assertOwns(booth, user);
    const body = c.req.valid("json");
    const row = await getDb().transaction(async (tx) => {
      if (body.isDefault) {
        await tx
          .update(productOptionValues)
          .set({ isDefault: false })
          .where(eq(productOptionValues.groupId, groupId));
      }
      const [created] = await tx
        .insert(productOptionValues)
        .values({ ...body, groupId })
        .returning();
      if (!created) {
        throw new Error("failed to create option value");
      }
      return created;
    });
    return c.json(row, 201);
  },
);

productOptionsRoutes.openapi(
  createRoute({
    method: "patch",
    path: "/option-values/{id}",
    tags: ["product-options"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      params: idParam,
      body: {
        content: { "application/json": { schema: valueBodySchema.partial() } },
      },
    },
    responses: {
      200: jsonContent(productOptionValueSchema, "Updated option value"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const valueId = c.req.valid("param").id;
    const { value, booth } = await requireValueOwner(valueId);
    assertOwns(booth, user);
    const body = c.req.valid("json");
    const row = await getDb().transaction(async (tx) => {
      if (body.isDefault) {
        await tx
          .update(productOptionValues)
          .set({ isDefault: false })
          .where(eq(productOptionValues.groupId, value.groupId));
      }
      const [updated] = await tx
        .update(productOptionValues)
        .set(body)
        .where(eq(productOptionValues.id, valueId))
        .returning();
      if (!updated) {
        throw new NotFoundError("option value not found");
      }
      return updated;
    });
    return c.json(row, 200);
  },
);

productOptionsRoutes.openapi(
  createRoute({
    method: "delete",
    path: "/option-values/{id}",
    tags: ["product-options"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: idParam },
    responses: {
      204: { description: "Archived option value" },
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const valueId = c.req.valid("param").id;
    const { booth } = await requireValueOwner(valueId);
    assertOwns(booth, user);
    await getDb()
      .update(productOptionValues)
      .set({ archivedAt: new Date() })
      .where(eq(productOptionValues.id, valueId));
    return c.body(null, 204);
  },
);
