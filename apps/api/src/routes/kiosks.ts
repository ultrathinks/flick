import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import {
  type AuthVariables,
  requireAuth,
  requireKiosk,
} from "../auth/middleware.ts";
import { getDb } from "../db/index.ts";
import {
  booths,
  kioskPairings,
  kiosks,
  productOptionGroups,
  productOptionValues,
  products,
} from "../db/schema/index.ts";
import { generatePairingCode, generateUniqueCode } from "../lib/codes.ts";
import { PAIRING_TTL_MS } from "../lib/constants.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../lib/errors.ts";
import { publishBoothEvent } from "../lib/events.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { generateSecret, hashSecret } from "../lib/security.ts";
import { boothEventStream } from "../lib/sse.ts";
import { errorResponse, jsonContent } from "../openapi/helpers.ts";
import {
  boothSchema,
  kioskSchema,
  productWithOptionsSchema,
} from "../openapi/schemas.ts";
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
    const normalizedCode = code.trim().toUpperCase();
    const token = generateSecret();
    const now = new Date();
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const [pairing] = await tx
        .update(kioskPairings)
        .set({ claimedAt: now })
        .where(
          and(
            eq(kioskPairings.codeHash, hashSecret(normalizedCode)),
            isNull(kioskPairings.claimedAt),
            gt(kioskPairings.expiresAt, now),
          ),
        )
        .returning();
      if (!pairing) {
        throw new BadRequestError("invalid pairing code");
      }
      const [kiosk] = await tx
        .insert(kiosks)
        .values({
          boothId: pairing.boothId,
          name: pairing.kioskName,
          tokenHash: hashSecret(token),
        })
        .returning();
      if (!kiosk) {
        throw new Error("failed to create kiosk");
      }
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
      200: jsonContent(z.array(productWithOptionsSchema), "Kiosk products"),
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
          inArray(products.status, ["available", "soldout"]),
          isNull(products.archivedAt),
        ),
      )
      .orderBy(asc(products.sortOrder), asc(products.createdAt));
    const productIds = rows.map((product) => product.id);
    const groups =
      productIds.length > 0
        ? await getDb()
            .select()
            .from(productOptionGroups)
            .where(
              and(
                inArray(productOptionGroups.productId, productIds),
                isNull(productOptionGroups.archivedAt),
              ),
            )
            .orderBy(asc(productOptionGroups.sortOrder))
        : [];
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
    const groupsByProduct = new Map<
      string,
      Array<(typeof groups)[number] & { values: typeof values }>
    >();
    for (const group of groups) {
      const list = groupsByProduct.get(group.productId) ?? [];
      list.push({ ...group, values: valuesByGroup.get(group.id) ?? [] });
      groupsByProduct.set(group.productId, list);
    }
    return c.json(
      rows.map((product) => ({
        ...product,
        optionGroups: groupsByProduct.get(product.id) ?? [],
      })),
      200,
    );
  },
);

kiosksRoutes.openapi(
  createRoute({
    method: "post",
    path: "/{id}/revoke",
    tags: ["kiosks"],
    security: [{ Bearer: [] }],
    middleware: [requireAuth] as const,
    request: { params: z.object({ id: z.string().uuid() }) },
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
    await publishBoothEvent(updated.boothId, {
      type: "kiosk.revoked",
      kioskId: updated.id,
    });
    await publishBoothEvent(updated.boothId, {
      type: "kiosk.presence",
      kioskId: updated.id,
      online: false,
    });
    return c.json(serializeKiosk(updated), 200);
  },
);

kiosksRoutes.openapi(
  createRoute({
    method: "post",
    path: "/me/heartbeat",
    tags: ["kiosks"],
    security: [{ Kiosk: [] }],
    middleware: [requireKiosk] as const,
    responses: {
      204: { description: "Heartbeat acknowledged" },
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const kiosk = c.get("kiosk");
    await getDb()
      .update(kiosks)
      .set({ lastSeenAt: new Date() })
      .where(eq(kiosks.id, kiosk.id));
    await publishBoothEvent(kiosk.boothId, {
      type: "kiosk.presence",
      kioskId: kiosk.id,
      online: true,
    });
    return c.body(null, 204);
  },
);

kiosksRoutes.get("/me/events", requireKiosk, (c) => {
  const kiosk = c.get("kiosk");
  return boothEventStream(c, {
    boothId: kiosk.boothId,
    filter: (event) => {
      switch (event.type) {
        case "product.updated":
          return true;
        case "payment.completed":
        case "payment.canceled":
        case "payment.expired":
        case "order.created":
        case "order.updated":
          return event.kioskId === kiosk.id;
        case "kiosk.presence":
        case "kiosk.revoked":
          return event.kioskId === kiosk.id;
        default:
          return false;
      }
    },
    shouldClose: (event) =>
      event.type === "kiosk.revoked" && event.kioskId === kiosk.id,
  });
});

kiosksRoutes.openapi(
  createRoute({
    method: "post",
    path: "/me/unpair",
    tags: ["kiosks"],
    security: [{ Kiosk: [] }],
    middleware: [requireKiosk] as const,
    responses: {
      204: { description: "Unpaired kiosk" },
      401: errorResponse("Unauthorized"),
    },
  }),
  async (c) => {
    const kiosk = c.get("kiosk");
    await getDb()
      .update(kiosks)
      .set({ revokedAt: new Date() })
      .where(eq(kiosks.id, kiosk.id));
    await publishBoothEvent(kiosk.boothId, {
      type: "kiosk.presence",
      kioskId: kiosk.id,
      online: false,
    });
    return c.body(null, 204);
  },
);

export async function createKioskPairing(
  boothId: string,
  createdBy: string,
  name: string,
) {
  const code = await generateUniqueCode(
    () => generatePairingCode(),
    async (candidate) => {
      const [existing] = await getDb()
        .select({ id: kioskPairings.id })
        .from(kioskPairings)
        .where(eq(kioskPairings.codeHash, hashSecret(candidate)))
        .limit(1);
      return Boolean(existing);
    },
  );
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
