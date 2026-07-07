import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.ts";
import { getDb } from "../src/db/index.ts";
import { orders, transactions, users } from "../src/db/schema/index.ts";
import { closeRedis } from "../src/lib/redis.ts";
import {
  authHeaders,
  createBoothWithKiosk,
  createOrderWithPayment,
  createProduct,
  createUser,
  resetDb,
} from "./helpers.ts";

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for integration tests");
  }
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeRedis();
});

describe("GET /v1/users (admin search)", () => {
  it("rejects non-admin", async () => {
    const user = await createUser();
    const res = await app.request("/v1/users", {
      headers: authHeaders(user.accessToken),
    });
    expect(res.status).toBe(403);
  });

  it("searches by name and student number, NFC-normalized", async () => {
    const admin = await createUser({ isAdmin: true });
    await getDb()
      .insert(users)
      .values([
        {
          dauthPublicId: "p-a",
          code: "code-a",
          username: "kim",
          name: "김철수",
          roles: ["STUDENT"],
          studentNumber: "1101",
        },
        {
          dauthPublicId: "p-b",
          code: "code-b",
          username: "lee",
          name: "이영희",
          roles: ["STUDENT"],
          studentNumber: "2202",
        },
      ]);

    const byName = await app.request(
      `/v1/users?q=${encodeURIComponent("김")}`,
      {
        headers: authHeaders(admin.accessToken),
      },
    );
    expect(byName.status).toBe(200);
    const nameBody = await byName.json();
    expect(nameBody.items.map((u: { name: string }) => u.name)).toEqual([
      "김철수",
    ]);

    const byNumber = await app.request("/v1/users?q=2202", {
      headers: authHeaders(admin.accessToken),
    });
    const numberBody = await byNumber.json();
    expect(numberBody.items.map((u: { name: string }) => u.name)).toEqual([
      "이영희",
    ]);
  });

  it("escapes SQL wildcards in the query", async () => {
    const admin = await createUser({ isAdmin: true });
    await getDb()
      .insert(users)
      .values({
        dauthPublicId: "p-c",
        code: "code-c",
        username: "x",
        name: "plain",
        roles: ["STUDENT"],
      });
    const res = await app.request("/v1/users?q=%25", {
      headers: authHeaders(admin.accessToken),
    });
    const body = await res.json();
    expect(body.items.every((u: { name: string }) => u.name !== "plain")).toBe(
      true,
    );
  });
});

describe("cursor pagination (keyset)", () => {
  it("pages without skips or duplicates across rows sharing a createdAt", async () => {
    const admin = await createUser({ isAdmin: true });
    const owner = await createUser();
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);

    const sharedInstant = new Date("2026-01-01T00:00:00.000Z");
    const ids: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      const [row] = await getDb()
        .insert(orders)
        .values({
          boothId,
          kioskId,
          totalAmount: 1000,
          status: "paid",
          createdAt: sharedInstant,
        })
        .returning();
      if (!row) {
        throw new Error("seed failed");
      }
      ids.push(row.id);
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    for (let guard = 0; guard < 10; guard += 1) {
      const url: string = cursor
        ? `/v1/orders?limit=2&cursor=${encodeURIComponent(cursor)}`
        : "/v1/orders?limit=2";
      const res = await app.request(url, {
        headers: authHeaders(admin.accessToken),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        items: { id: string }[];
        nextCursor: string | null;
      };
      seen.push(...body.items.map((o) => o.id));
      cursor = body.nextCursor;
      if (!cursor) {
        break;
      }
    }

    expect(seen.length).toBe(5);
    expect(new Set(seen).size).toBe(5);
    expect([...seen].sort()).toEqual([...ids].sort());
  });

  it("rejects a malformed cursor", async () => {
    const admin = await createUser({ isAdmin: true });
    const res = await app.request("/v1/orders?cursor=not-valid", {
      headers: authHeaders(admin.accessToken),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /v1/orders (admin monitor)", () => {
  it("joins booth name and null-safe buyer name, filters by status", async () => {
    const admin = await createUser({ isAdmin: true });
    const owner = await createUser();
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId);
    await createOrderWithPayment(boothId, kioskId, productId);

    const res = await app.request("/v1/orders", {
      headers: authHeaders(admin.accessToken),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBe(1);
    expect(body.items[0].boothName).toBe("Booth");
    expect(body.items[0].buyerName).toBeNull();

    const filtered = await app.request("/v1/orders?status=paid", {
      headers: authHeaders(admin.accessToken),
    });
    const filteredBody = await filtered.json();
    expect(filteredBody.items.length).toBe(0);
  });
});

describe("GET /v1/audit-logs", () => {
  it("returns logs with actor name and exposes metadata", async () => {
    const admin = await createUser({ isAdmin: true });
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id, {
      status: "pending",
    });
    await app.request(`/v1/booths/${boothId}/approve`, {
      method: "POST",
      headers: authHeaders(admin.accessToken),
    });

    const res = await app.request("/v1/audit-logs", {
      headers: authHeaders(admin.accessToken),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBe(1);
    expect(body.items[0].action).toBe("booth.approve");
    expect(typeof body.items[0].actorName).toBe("string");
  });
});

describe("POST /v1/refunds (booth owner only)", () => {
  async function paidOrder() {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId);
    const { orderId } = await createOrderWithPayment(
      boothId,
      kioskId,
      productId,
      { price: 1000 },
    );
    await getDb()
      .update(orders)
      .set({ status: "paid", buyerId: buyer.id, paidAt: new Date() })
      .where(eq(orders.id, orderId));
    await getDb().insert(transactions).values({
      userId: buyer.id,
      amount: -1000,
      type: "purchase",
      orderId,
    });
    return { owner, buyer, orderId };
  }

  it("lets the booth owner refund and restores buyer balance", async () => {
    const { owner, buyer, orderId } = await paidOrder();
    const before = await balanceOf(buyer.id);
    const res = await app.request("/v1/refunds", {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ orderId }),
    });
    expect(res.status).toBe(201);
    const after = await balanceOf(buyer.id);
    expect(after - before).toBe(1000);
    const [order] = await getDb()
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));
    expect(order?.status).toBe("refunded");
  });

  it("forbids a non-owner (even admin) from refunding", async () => {
    const { orderId } = await paidOrder();
    const admin = await createUser({ isAdmin: true });
    const res = await app.request("/v1/refunds", {
      method: "POST",
      headers: authHeaders(admin.accessToken),
      body: JSON.stringify({ orderId }),
    });
    expect(res.status).toBe(403);
  });
});

describe("user code (stable per-user identifier)", () => {
  it("returns the caller's own code and never rotates it", async () => {
    const user = await createUser();
    const first = await app.request("/v1/users/me/code", {
      headers: authHeaders(user.accessToken),
    });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ code: user.code });

    const second = await app.request("/v1/users/me/code", {
      headers: authHeaders(user.accessToken),
    });
    expect(await second.json()).toEqual({ code: user.code });
  });

  it("resolves a user by code and credits their balance", async () => {
    const admin = await createUser({ isAdmin: true });
    const target = await createUser({ code: "scan-me-123", balance: 1000 });

    const resolved = await app.request("/v1/user-codes/resolve", {
      method: "POST",
      headers: authHeaders(admin.accessToken),
      body: JSON.stringify({ code: "scan-me-123" }),
    });
    expect(resolved.status).toBe(200);
    const resolvedBody = await resolved.json();
    expect(resolvedBody.userId).toBe(target.id);

    const charge = await app.request("/v1/charges", {
      method: "POST",
      headers: authHeaders(admin.accessToken),
      body: JSON.stringify({
        userId: resolvedBody.userId,
        amount: 5000,
        idempotencyKey: "k-1",
      }),
    });
    expect(charge.status).toBe(201);
    expect(await balanceOf(target.id)).toBe(6000);
  });

  it("returns 404 for an unknown code", async () => {
    const admin = await createUser({ isAdmin: true });
    const res = await app.request("/v1/user-codes/resolve", {
      method: "POST",
      headers: authHeaders(admin.accessToken),
      body: JSON.stringify({ code: "does-not-exist" }),
    });
    expect(res.status).toBe(404);
  });

  it("rotate endpoint no longer exists", async () => {
    const user = await createUser();
    const res = await app.request("/v1/users/me/code/rotate", {
      method: "POST",
      headers: authHeaders(user.accessToken),
    });
    expect(res.status).toBe(404);
  });
});

async function balanceOf(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ balance: users.balance })
    .from(users)
    .where(eq(users.id, userId));
  return row?.balance ?? 0;
}
