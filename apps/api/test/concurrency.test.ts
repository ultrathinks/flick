import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.ts";
import { getDb } from "../src/db/index.ts";
import {
  products,
  refunds,
  transactions,
  users,
} from "../src/db/schema/index.ts";
import { closeEvents } from "../src/lib/events.ts";
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
  await closeEvents();
});

async function balanceOf(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ balance: users.balance })
    .from(users)
    .where(eq(users.id, userId));
  return row?.balance ?? 0;
}

async function purchaseCount(orderId: string): Promise<number> {
  const rows = await getDb()
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.orderId, orderId), eq(transactions.type, "purchase")),
    );
  return rows.length;
}

describe("concurrent confirms (double-debit prevention)", () => {
  it("debits exactly once under duplicate concurrent confirms", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 10000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000, stock: 100 });
    const { orderId, code } = await createOrderWithPayment(
      boothId,
      kioskId,
      productId,
      { price: 1000 },
    );

    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        app.request(`/v1/payment-codes/${code}/confirm`, {
          method: "POST",
          headers: authHeaders(buyer.accessToken),
        }),
      ),
    );
    const statuses = results.map((r) => r.status);

    expect(statuses.filter((s) => s >= 500)).toHaveLength(0);
    expect(statuses.filter((s) => s === 200).length).toBeGreaterThanOrEqual(1);
    expect(await purchaseCount(orderId)).toBe(1);
    expect(await balanceOf(buyer.id)).toBe(9000);
  });
});

describe("concurrent orders on the last unit of stock", () => {
  it("sells the last unit at most once and cancels the losers", async () => {
    const owner = await createUser();
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000, stock: 1 });

    const buyers = await Promise.all(
      Array.from({ length: 6 }, () => createUser({ balance: 10000 })),
    );
    const orders = await Promise.all(
      buyers.map(() =>
        createOrderWithPayment(boothId, kioskId, productId, { price: 1000 }),
      ),
    );

    const results = await Promise.all(
      orders.map((order, i) =>
        app.request(`/v1/payment-codes/${order.code}/confirm`, {
          method: "POST",
          headers: authHeaders(buyers[i]?.accessToken ?? ""),
        }),
      ),
    );
    const statuses = results.map((r) => r.status);

    expect(statuses.filter((s) => s >= 500)).toHaveLength(0);
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);

    const [product] = await getDb()
      .select()
      .from(products)
      .where(eq(products.id, productId));
    expect(product?.stock).toBe(0);
    expect(product?.status).toBe("soldout");

    const paidCount = (
      await Promise.all(orders.map((o) => purchaseCount(o.orderId)))
    ).reduce((sum, n) => sum + n, 0);
    expect(paidCount).toBe(1);
  });
});

describe("concurrent refunds on one order", () => {
  it("credits the buyer exactly once", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 2000, stock: 5 });
    const { orderId, code } = await createOrderWithPayment(
      boothId,
      kioskId,
      productId,
      { price: 2000 },
    );
    await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(await balanceOf(buyer.id)).toBe(3000);

    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        app.request("/v1/refunds", {
          method: "POST",
          headers: authHeaders(owner.accessToken),
          body: JSON.stringify({ orderId }),
        }),
      ),
    );
    const statuses = results.map((r) => r.status);

    expect(statuses.filter((s) => s >= 500)).toHaveLength(0);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(await balanceOf(buyer.id)).toBe(5000);

    const refundRows = await getDb()
      .select()
      .from(refunds)
      .where(eq(refunds.orderId, orderId));
    expect(refundRows).toHaveLength(1);
  });
});

describe("concurrent charges with one idempotency key", () => {
  it("credits the balance exactly once", async () => {
    const admin = await createUser({ isAdmin: true });
    const target = await createUser({ balance: 0 });

    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        app.request("/v1/charges", {
          method: "POST",
          headers: authHeaders(admin.accessToken),
          body: JSON.stringify({
            userId: target.id,
            amount: 5000,
            idempotencyKey: "same-key",
          }),
        }),
      ),
    );
    const statuses = results.map((r) => r.status);

    expect(statuses.filter((s) => s >= 500)).toHaveLength(0);
    expect(statuses.every((s) => s === 201)).toBe(true);
    expect(await balanceOf(target.id)).toBe(5000);

    const charges = await getDb()
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, target.id),
          eq(transactions.idempotencyKey, "same-key"),
        ),
      );
    expect(charges).toHaveLength(1);
  });
});
