import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, isNull } from "drizzle-orm";
import {
  type AuthVariables,
  requireAuth,
  requireKiosk,
} from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import { booths, kioskPairings, kiosks, products } from "../db/schema/index.ts";
import { PAIRING_TTL_MS } from "../lib/constants.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { generateSecret, hashSecret } from "../lib/security.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import { boothSchema, kioskSchema, productSchema } from "../openapi/schemas.ts";
import { serializeBooth, serializeKiosk } from "../openapi/serializers.ts";

const createKioskSchema = z.object({
  name: z.string().min(1),
});

const pairSchema = z.object({
  code: z.string().min(1),
});

export const kiosksRoutes = new OpenAPIHono<{ Variables: AuthVariables }>();

kiosksRoutes.openapi(
  createRoute({
    method: "post",
    path: "/pair",
    tags: ["kiosks"],
    middleware: [rateLimit(20, "kiosks:pair")] as const,
    request: {
      body: { content: { "application/json": { schema: pairSchema } } },
    },
    responses: {
      201: jsonContent(
        z.object({ kiosk: kioskSchema, deviceToken: z.string() }),
        "Paired kiosk",
      ),
      400: errorResponse("Bad request"),
      429: errorResponse("Too many requests"),
    },
  }),
  async (c) => {
    const { code } = c.req.valid("json");
    const token = generateSecret();
    const now = new Date();
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const [pairing] = await tx
        .select()
        .from(kioskPairings)
        .where(
          and(
            eq(kioskPairings.codeHash, hashSecret(code)),
            isNull(kioskPairings.claimedAt),
          ),
        )
        .limit(1);
      if (!pairing || pairing.expiresAt <= now) {
        throw new BadRequestError("invalid pairing code");
      }
      const [kiosk] = await tx
        .insert(kiosks)
        .values({
          boothId: pairing.boothId,
          name: pairing.kioskName,
          tokenHash: hashSecret(token),
          lastSeenAt: now,
        })
        .returning();
      if (!kiosk) {
        throw new Error("failed to create kiosk");
      }
      await tx
        .update(kioskPairings)
        .set({ claimedAt: now })
        .where(eq(kioskPairings.id, pairing.id));
      return kiosk;
    });
    return c.json({ kiosk: serializeKiosk(result), deviceToken: token }, 201);
  },
);

kiosksRoutes.openapi(
  createRoute({
    method: "get",
    path: "/me",
    tags: ["kiosks"],
    security: [{ Kiosk: [] }],
    middleware: [requireKiosk] as const,
    responses: {
      200: jsonContent(
        z.object({ kiosk: kioskSchema, booth: boothSchema }),
        "Current kiosk",
      ),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const kiosk = c.get("kiosk");
    const [booth] = await getDb()
      .select()
      .from(booths)
      .where(eq(booths.id, kiosk.boothId));
    if (!booth) {
      throw new NotFoundError("booth not found");
    }
    return c.json(
      { kiosk: serializeKiosk(kiosk), booth: serializeBooth(booth) },
      200,
    );
  },
);

kiosksRoutes.openapi(
  createRoute({
    method: "get",
    path: "/me/products",
    tags: ["kiosks"],
    security: [{ Kiosk: [] }],
    middleware: [requireKiosk] as const,
    responses: {
      200: jsonContent(z.array(productSchema), "Kiosk products"),
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const kiosk = c.get("kiosk");
    const rows = await getDb()
      .select()
      .from(products)
      .where(
        and(
          eq(products.boothId, kiosk.boothId),
          eq(products.status, "available"),
        ),
      );
    return c.json(rows, 200);
  },
);

kiosksRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{id}/revoke",
    tags: ["kiosks"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: jsonContent(kioskSchema, "Revoked kiosk"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Forbidden"),
      404: errorResponse("Not found"),
    },
  }),
  async (c) => {
    const user = c.get("user");
    const kioskId = c.req.valid("param").id;
    const [row] = await getDb()
      .select({ kiosk: kiosks, booth: booths })
      .from(kiosks)
      .innerJoin(booths, eq(kiosks.boothId, booths.id))
      .where(eq(kiosks.id, kioskId));
    if (!row) {
      throw new NotFoundError("kiosk not found");
    }
    if (!user.isAdmin && row.booth.ownerId !== user.id) {
      throw new ForbiddenError();
    }
    const [updated] = await getDb()
      .update(kiosks)
      .set({ revokedAt: new Date() })
      .where(eq(kiosks.id, kioskId))
      .returning();
    if (!updated) {
      throw new NotFoundError("kiosk not found");
    }
    return c.json(serializeKiosk(updated), 200);
  },
);

export async function createKioskPairing(
  boothId: string,
  createdBy: string,
  name: string,
) {
  const code = generateSecret(16);
  const [row] = await getDb()
    .insert(kioskPairings)
    .values({
      boothId,
      createdBy,
      kioskName: name,
      codeHash: hashSecret(code),
      expiresAt: new Date(Date.now() + PAIRING_TTL_MS),
    })
    .returning();
  if (!row) {
    throw new Error("failed to create kiosk pairing");
  }
  return { pairing: row, code };
}

export { createKioskSchema };
