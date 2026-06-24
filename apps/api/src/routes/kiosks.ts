import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
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

const createKioskSchema = z.object({
  name: z.string().min(1),
});

const pairSchema = z.object({
  code: z.string().min(1),
});

export const kiosksRoutes = new Hono<{ Variables: AuthVariables }>();

kiosksRoutes.post(
  "/pair",
  rateLimit(20, "kiosks:pair"),
  zValidator("json", pairSchema),
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
    return c.json({ kiosk: result, deviceToken: token }, 201);
  },
);

kiosksRoutes.get("/me", requireKiosk, async (c) => {
  const kiosk = c.get("kiosk");
  const [booth] = await getDb()
    .select()
    .from(booths)
    .where(eq(booths.id, kiosk.boothId));
  return c.json({ kiosk, booth });
});

kiosksRoutes.get("/me/products", requireKiosk, async (c) => {
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
  return c.json(rows);
});

kiosksRoutes.post("/:id/revoke", requireAuth, async (c) => {
  const user = c.get("user");
  const kioskId = c.req.param("id") as string;
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
  return c.json(updated);
});

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
  return { pairing: row, code };
}

export { createKioskSchema };
