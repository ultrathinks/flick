import { OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { type AuthVariables, requireAuth } from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { booths, products } from "../db/schema/index.ts";
import { MAX_UPLOAD_BYTES } from "../lib/constants.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors.ts";
import { isSupportedImage, processAndUploadImage } from "../lib/storage.ts";

const CONTENT_LENGTH_OVERHEAD = 1024 * 1024;

const fieldsSchema = z.object({
  kind: z.enum(["booth", "product"]),
  targetId: z.string().uuid(),
});

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

uploadsRoutes.post("/", requireAuth, async (c) => {
  const user = c.get("user");

  const declaredLength = Number(c.req.header("content-length") ?? "0");
  if (declaredLength > MAX_UPLOAD_BYTES + CONTENT_LENGTH_OVERHEAD) {
    throw new BadRequestError("image too large");
  }

  const form = await c.req.parseBody();
  const fields = fieldsSchema.safeParse({
    kind: form.kind,
    targetId: form.targetId,
  });
  if (!fields.success) {
    throw new BadRequestError("invalid upload fields");
  }

  const file = form.file;
  if (!(file instanceof File)) {
    throw new BadRequestError("file is required");
  }
  const input = Buffer.from(await file.arrayBuffer());
  if (input.byteLength === 0) {
    throw new BadRequestError("file is empty");
  }
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new BadRequestError("image too large");
  }
  if (!isSupportedImage(input)) {
    throw new BadRequestError("unsupported image format");
  }

  await assertOwnsTarget(fields.data.kind, fields.data.targetId, user);

  const imageUrl = await processAndUploadImage({
    kind: fields.data.kind,
    targetId: fields.data.targetId,
    input,
  });

  if (fields.data.kind === "booth") {
    await getDb()
      .update(booths)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(booths.id, fields.data.targetId));
  } else {
    await getDb()
      .update(products)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(products.id, fields.data.targetId));
  }

  return c.json({ imageUrl }, 201);
});
