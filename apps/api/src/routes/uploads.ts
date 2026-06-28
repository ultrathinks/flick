import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { type AuthVariables, requireAuth } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { booths, products } from "../db/schema/index.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors.ts";
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  isAllowedContentType,
  presignUpload,
} from "../lib/storage.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";

const presignBodySchema = z.object({
  kind: z.enum(["booth", "product"]),
  targetId: z.string(),
  contentType: z.enum(ALLOWED_UPLOAD_CONTENT_TYPES as [string, ...string[]]),
});

const presignResponseSchema = z
  .object({
    uploadUrl: z.string(),
    publicUrl: z.string(),
    key: z.string(),
  })
  .openapi("PresignUpload");

async function assertOwnsTarget(
  kind: "booth" | "product",
  targetId: string,
  user: { id: string; isAdmin: boolean },
) {
  if (kind === "booth") {
    const [booth] = await getDb()
      .select()
      .from(booths)
      .where(eq(booths.id, targetId));
    if (!booth) {
      throw new NotFoundError("booth not found");
    }
    if (!user.isAdmin && booth.ownerId !== user.id) {
      throw new ForbiddenError();
    }
    return;
  }
  const [row] = await getDb()
    .select({ booth: booths })
    .from(products)
    .innerJoin(booths, eq(products.boothId, booths.id))
    .where(eq(products.id, targetId));
  if (!row) {
    throw new NotFoundError("product not found");
  }
  if (!user.isAdmin && row.booth.ownerId !== user.id) {
    throw new ForbiddenError();
  }
}

export const uploadsRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

uploadsRoutes.openapi(
  createRoute({
    method: "post",
    path: "/presign",
    tags: ["uploads"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: {
      body: { content: { "application/json": { schema: presignBodySchema } } },
    },
    responses: {
      201: jsonContent(presignResponseSchema, "Presigned upload"),
      400: errorResponse("Bad request"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    if (!isAllowedContentType(body.contentType)) {
      throw new BadRequestError("unsupported content type");
    }
    await assertOwnsTarget(body.kind, body.targetId, user);
    const result = await presignUpload({
      kind: body.kind,
      targetId: body.targetId,
      contentType: body.contentType,
    });
    return c.json(result, 201);
  },
);
