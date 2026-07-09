import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.ts";
import { getDb } from "../src/db/index.ts";
import {
  booths,
  orders,
  payouts,
  products,
  transactions,
  users,
} from "../src/db/schema/index.ts";
import { closeRedis } from "../src/lib/redis.ts";
import {
  authHeaders,
  createBoothWithKiosk,
  createOptionGroup,
  createOptionValue,
  createOrderWithPayment,
  createProduct,
  createUser,
  kioskHeaders,
  resetDb,
} from "./helpers.ts";

async function balanceOf(userId: string): Promise<number> {
  const [row] = await getDb().select().from(users).where(eq(users.id, userId));
  return row?.balance ?? 0;
}

async function ledgerOf(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(eq(transactions.userId, userId));
  return row?.total ?? 0;
}

async function stockOf(productId: string): Promise<number | null> {
  const [row] = await getDb()
    .select({ stock: products.stock })
    .from(products)
    .where(eq(products.id, productId));
  return row?.stock ?? null;
}

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

describe("auth guards", () => {
  it("rejects unauthenticated access", async () => {
    const res = await app.request("/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("rejects non-admin on admin route", async () => {
    const user = await createUser();
    const res = await app.request("/v1/charges", {
      method: "POST",
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        userId: user.id,
        amount: 100,
        idempotencyKey: "k",
      }),
    });
    expect(res.status).toBe(403);
  });
});

describe("grant", () => {
  it("seeds exactly one grant and balance invariant holds", async () => {
    const user = await createUser({ balance: 1000 });
    expect(await balanceOf(user.id)).toBe(1000);
    expect(await ledgerOf(user.id)).toBe(1000);
  });
});

describe("charge", () => {
  it("charges and is idempotent on the same key", async () => {
    const admin = await createUser({ isAdmin: true });
    const user = await createUser({ balance: 1000 });
    const body = JSON.stringify({
      userId: user.id,
      amount: 5000,
      idempotencyKey: "charge-1",
    });

    const first = await app.request("/v1/charges", {
      method: "POST",
      headers: authHeaders(admin.accessToken),
      body,
    });
    expect(first.status).toBe(201);
    expect(await balanceOf(user.id)).toBe(6000);

    const second = await app.request("/v1/charges", {
      method: "POST",
      headers: authHeaders(admin.accessToken),
      body,
    });
    expect(second.status).toBe(201);
    expect(await balanceOf(user.id)).toBe(6000);
    expect(await ledgerOf(user.id)).toBe(6000);
  });
});

describe("payment confirm", () => {
  it("confirms, debits the authenticated buyer, decrements stock", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1500, stock: 3 });
    const { orderId, code } = await createOrderWithPayment(
      boothId,
      kioskId,
      productId,
      {
        price: 1500,
      },
    );

    const res = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(res.status).toBe(200);
    const order = (await res.json()) as {
      id: string;
      status: string;
      buyerId: string;
    };
    expect(order.status).toBe("paid");
    expect(order.buyerId).toBe(buyer.id);
    expect(await balanceOf(buyer.id)).toBe(3500);
    expect(await ledgerOf(buyer.id)).toBe(3500);

    const [row] = await getDb()
      .select()
      .from(transactions)
      .where(eq(transactions.orderId, orderId));
    expect(row?.type).toBe("purchase");
    expect(row?.amount).toBe(-1500);
  });

  it("is idempotent when the same buyer retries", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000, stock: 5 });
    const { code } = await createOrderWithPayment(boothId, kioskId, productId);

    const first = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(first.status).toBe(200);
    const second = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(second.status).toBe(200);
    expect(await balanceOf(buyer.id)).toBe(4000);
  });

  it("rejects on insufficient balance without touching balance or stock", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 1000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 5000, stock: 2 });
    const { code } = await createOrderWithPayment(boothId, kioskId, productId, {
      price: 5000,
    });

    const res = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(res.status).toBe(400);
    expect(await balanceOf(buyer.id)).toBe(1000);
  });

  it("rejects confirm by a different user after completion", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const other = await createUser({ balance: 5000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000, stock: 5 });
    const { code } = await createOrderWithPayment(boothId, kioskId, productId);

    await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    const res = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(other.accessToken),
    });
    expect(res.status).toBe(400);
    expect(await balanceOf(other.id)).toBe(5000);
  });

  it("blocks confirm after the order is canceled and keeps balance intact", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const { boothId, kioskId, deviceToken } = await createBoothWithKiosk(
      owner.id,
    );
    const productId = await createProduct(boothId, { price: 1000, stock: 5 });
    const { orderId, code } = await createOrderWithPayment(
      boothId,
      kioskId,
      productId,
    );

    const cancelRes = await app.request(`/v1/orders/${orderId}/cancel`, {
      method: "POST",
      headers: kioskHeaders(deviceToken),
    });
    expect(cancelRes.status).toBe(200);

    const res = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(res.status).toBe(400);
    expect(await balanceOf(buyer.id)).toBe(5000);
    expect(await ledgerOf(buyer.id)).toBe(5000);

    const [row] = await getDb()
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));
    expect(row?.status).toBe("canceled");
  });
});

describe("refund", () => {
  it("refunds a paid order once and credits the buyer", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 2000, stock: 5 });
    const { orderId, code } = await createOrderWithPayment(
      boothId,
      kioskId,
      productId,
      {
        price: 2000,
      },
    );
    await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(await balanceOf(buyer.id)).toBe(3000);

    const first = await app.request("/v1/refunds", {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ orderId }),
    });
    expect(first.status).toBe(201);
    expect(await balanceOf(buyer.id)).toBe(5000);

    const second = await app.request("/v1/refunds", {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ orderId }),
    });
    expect(second.status).toBe(400);
    expect(await balanceOf(buyer.id)).toBe(5000);
  });

  it("restores product stock when refunding", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000, stock: 5 });
    const { orderId, code } = await createOrderWithPayment(
      boothId,
      kioskId,
      productId,
      { price: 1000, quantity: 2 },
    );
    await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(await stockOf(productId)).toBe(3);

    const refund = await app.request("/v1/refunds", {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ orderId }),
    });
    expect(refund.status).toBe(201);
    expect(await stockOf(productId)).toBe(5);
  });

  it("leaves unlimited (null) stock untouched on refund", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 5000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, {
      price: 1000,
      stock: null,
    });
    const { orderId, code } = await createOrderWithPayment(
      boothId,
      kioskId,
      productId,
      { price: 1000 },
    );
    await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(await stockOf(productId)).toBeNull();

    const refund = await app.request("/v1/refunds", {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ orderId }),
    });
    expect(refund.status).toBe(201);
    expect(await stockOf(productId)).toBeNull();
  });
});

describe("payout", () => {
  it("saves a payout account and reports available balance", async () => {
    const user = await createUser({ balance: 20000 });

    const putRes = await app.request("/v1/users/me/payout", {
      method: "PUT",
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        bankName: "Bank",
        accountNumber: "1234567890",
        accountHolder: "User",
      }),
    });
    expect(putRes.status).toBe(200);
    const saved = (await putRes.json()) as { accountNumber: string };
    expect(saved.accountNumber).toBe("1234567890");

    const getRes = await app.request("/v1/users/me/payout", {
      headers: authHeaders(user.accessToken),
    });
    expect(getRes.status).toBe(200);
    const summary = (await getRes.json()) as {
      availableAmount: number;
      account: { bankName: string; accountNumber: string } | null;
    };
    expect(summary.availableAmount).toBe(14000);
    expect(summary.account?.accountNumber).toBe("1234567890");

    expect(await balanceOf(user.id)).toBe(20000);
    expect(await ledgerOf(user.id)).toBe(20000);
  });

  it("overwrites the account on repeat save", async () => {
    const user = await createUser({ balance: 20000 });

    await app.request("/v1/users/me/payout", {
      method: "PUT",
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        bankName: "Bank",
        accountNumber: "1234567890",
        accountHolder: "User",
      }),
    });
    const second = await app.request("/v1/users/me/payout", {
      method: "PUT",
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        bankName: "Other Bank",
        accountNumber: "9876543210",
        accountHolder: "User",
      }),
    });
    expect(second.status).toBe(200);

    const rows = await getDb()
      .select()
      .from(payouts)
      .where(eq(payouts.userId, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.accountNumber).toBe("9876543210");
    expect(rows[0]?.bankName).toBe("Other Bank");
  });

  it("returns a null account when none is saved", async () => {
    const user = await createUser({ balance: 20000 });
    const getRes = await app.request("/v1/users/me/payout", {
      headers: authHeaders(user.accessToken),
    });
    expect(getRes.status).toBe(200);
    const summary = (await getRes.json()) as {
      availableAmount: number;
      account: unknown;
    };
    expect(summary.availableAmount).toBe(14000);
    expect(summary.account).toBeNull();
  });

  it("exposes the plain account and available balance in the admin list", async () => {
    const admin = await createUser({ isAdmin: true });
    const user = await createUser({ balance: 20000 });
    await app.request("/v1/users/me/payout", {
      method: "PUT",
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        bankName: "Bank",
        accountNumber: "1234567890",
        accountHolder: "User",
      }),
    });
    const res = await app.request("/v1/payouts", {
      headers: authHeaders(admin.accessToken),
    });
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{
      accountNumber: string;
      availableAmount: number;
    }>;
    expect(list[0]?.accountNumber).toBe("1234567890");
    expect(list[0]?.availableAmount).toBe(14000);
  });
});

describe("kiosk order flow", () => {
  it("creates an order from kiosk and issues a payment", async () => {
    const owner = await createUser();
    const { boothId, kioskId, deviceToken } = await createBoothWithKiosk(
      owner.id,
    );
    const productId = await createProduct(boothId, { price: 1200, stock: 4 });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({ items: [{ productId, quantity: 2 }] }),
    });
    expect(orderRes.status).toBe(201);
    const order = (await orderRes.json()) as {
      id: string;
      totalAmount: number;
      boothId: string;
    };
    expect(order.totalAmount).toBe(2400);
    expect(order.boothId).toBe(boothId);
    expect(kioskId).toBeTruthy();

    const payRes = await app.request(`/v1/orders/${order.id}/payments`, {
      method: "POST",
      headers: kioskHeaders(deviceToken),
    });
    expect(payRes.status).toBe(201);
    const payload = (await payRes.json()) as { code: string };
    expect(payload.code).toBeTruthy();
  });
});

describe("kiosk order options", () => {
  it("applies option price deltas to unit price and snapshots them", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 10000 });
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000, stock: 10 });
    const sizeGroup = await createOptionGroup(productId, {
      name: "Size",
      required: true,
    });
    const large = await createOptionValue(sizeGroup, {
      name: "L",
      priceDelta: 500,
    });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({
        items: [{ productId, quantity: 2, optionValueIds: [large] }],
      }),
    });
    expect(orderRes.status).toBe(201);
    const order = (await orderRes.json()) as {
      id: string;
      totalAmount: number;
    };
    expect(order.totalAmount).toBe(3000);

    const payRes = await app.request(`/v1/orders/${order.id}/payments`, {
      method: "POST",
      headers: kioskHeaders(deviceToken),
    });
    const { code } = (await payRes.json()) as { code: string };

    const viewRes = await app.request(`/v1/payment-codes/${code}`, {
      headers: authHeaders(buyer.accessToken),
    });
    expect(viewRes.status).toBe(200);
    const view = (await viewRes.json()) as {
      items: Array<{
        unitPrice: number;
        options: Array<{ valueName: string; priceDelta: number }>;
      }>;
    };
    expect(view.items[0]?.unitPrice).toBe(1500);
    expect(view.items[0]?.options).toHaveLength(1);
    expect(view.items[0]?.options[0]?.valueName).toBe("L");
    expect(view.items[0]?.options[0]?.priceDelta).toBe(500);

    const confirmRes = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(confirmRes.status).toBe(200);
    expect(await balanceOf(buyer.id)).toBe(7000);
    expect(await ledgerOf(buyer.id)).toBe(7000);
  });

  it("rejects when a required option group is not selected", async () => {
    const owner = await createUser();
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000 });
    const group = await createOptionGroup(productId, { required: true });
    await createOptionValue(group, { name: "L" });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({ items: [{ productId, quantity: 1 }] }),
    });
    expect(orderRes.status).toBe(400);
  });

  it("rejects an option value from another product", async () => {
    const owner = await createUser();
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);
    const productA = await createProduct(boothId, { price: 1000 });
    const productB = await createProduct(boothId, { price: 1000 });
    const groupB = await createOptionGroup(productB, { required: false });
    const valueB = await createOptionValue(groupB, { name: "L" });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({
        items: [{ productId: productA, quantity: 1, optionValueIds: [valueB] }],
      }),
    });
    expect(orderRes.status).toBe(400);
  });

  it("allows multiple values when maxSelect is unlimited", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 10000 });
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000, stock: 10 });
    const toppings = await createOptionGroup(productId, {
      name: "Toppings",
      required: false,
      maxSelect: null,
    });
    const cheese = await createOptionValue(toppings, {
      name: "Cheese",
      priceDelta: 500,
    });
    const egg = await createOptionValue(toppings, {
      name: "Egg",
      priceDelta: 300,
    });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({
        items: [{ productId, quantity: 1, optionValueIds: [cheese, egg] }],
      }),
    });
    expect(orderRes.status).toBe(201);
    const order = (await orderRes.json()) as { totalAmount: number };
    expect(order.totalAmount).toBe(1800);
    expect(buyer.id).toBeDefined();
  });

  it("rejects selecting more values than maxSelect allows", async () => {
    const owner = await createUser();
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000, stock: 10 });
    const group = await createOptionGroup(productId, {
      name: "Sauce",
      required: false,
      maxSelect: 1,
    });
    const mild = await createOptionValue(group, { name: "Mild" });
    const spicy = await createOptionValue(group, { name: "Spicy" });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({
        items: [{ productId, quantity: 1, optionValueIds: [mild, spicy] }],
      }),
    });
    expect(orderRes.status).toBe(400);
  });
});

describe("booth approval gate", () => {
  it("rejects kiosk orders for an unapproved booth", async () => {
    const owner = await createUser();
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id, {
      status: "pending",
    });
    const productId = await createProduct(boothId, { price: 1000 });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({ items: [{ productId, quantity: 1 }] }),
    });
    expect(orderRes.status).toBe(400);
  });
});

describe("unlimited stock", () => {
  it("does not block payment when stock is null", async () => {
    const owner = await createUser();
    const buyer = await createUser({ balance: 10000 });
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, {
      price: 1000,
      stock: null,
    });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({ items: [{ productId, quantity: 3 }] }),
    });
    expect(orderRes.status).toBe(201);
    const order = (await orderRes.json()) as { id: string };

    const payRes = await app.request(`/v1/orders/${order.id}/payments`, {
      method: "POST",
      headers: kioskHeaders(deviceToken),
    });
    const { code } = (await payRes.json()) as { code: string };

    const confirmRes = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(confirmRes.status).toBe(200);
    expect(await balanceOf(buyer.id)).toBe(7000);
  });
});

describe("option management", () => {
  it("creates a product with nested options and lists them", async () => {
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);

    const createRes = await app.request(`/v1/booths/${boothId}/products`, {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({
        name: "Tteokbokki",
        price: 3000,
        options: [
          {
            name: "Size",
            required: true,
            maxSelect: 1,
            values: [
              { name: "M", priceDelta: 0, isDefault: true },
              { name: "L", priceDelta: 500 },
            ],
          },
        ],
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      id: string;
      optionGroups: Array<{
        name: string;
        maxSelect: number | null;
        values: Array<{ name: string; priceDelta: number; isDefault: boolean }>;
      }>;
    };
    expect(created.optionGroups).toHaveLength(1);
    expect(created.optionGroups[0]?.name).toBe("Size");
    expect(created.optionGroups[0]?.maxSelect).toBe(1);
    expect(created.optionGroups[0]?.values).toHaveLength(2);
    expect(created.optionGroups[0]?.values[0]?.isDefault).toBe(true);

    const listRes = await app.request(`/v1/booths/${boothId}/products`, {
      headers: authHeaders(owner.accessToken),
    });
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as Array<{
      id: string;
      optionGroups: Array<{ values: unknown[] }>;
    }>;
    expect(list[0]?.optionGroups[0]?.values).toHaveLength(2);
  });

  it("rejects a base price above the maximum", async () => {
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);

    const res = await app.request(`/v1/booths/${boothId}/products`, {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ name: "Pricey", price: 3001 }),
    });
    expect(res.status).toBe(400);
  });

  it("replaces options on patch and leaves them untouched when omitted", async () => {
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000 });
    const group = await createOptionGroup(productId, { name: "Size" });
    await createOptionValue(group, { name: "L" });

    const patchNameRes = await app.request(`/v1/products/${productId}`, {
      method: "PATCH",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ name: "Renamed" }),
    });
    expect(patchNameRes.status).toBe(200);
    const patchedName = (await patchNameRes.json()) as {
      name: string;
      optionGroups: unknown[];
    };
    expect(patchedName.name).toBe("Renamed");
    expect(patchedName.optionGroups).toHaveLength(1);

    const replaceRes = await app.request(`/v1/products/${productId}`, {
      method: "PATCH",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({
        options: [
          { name: "Spice", required: false, values: [{ name: "Hot" }] },
        ],
      }),
    });
    expect(replaceRes.status).toBe(200);
    const replaced = (await replaceRes.json()) as {
      optionGroups: Array<{ name: string; values: Array<{ name: string }> }>;
    };
    expect(replaced.optionGroups).toHaveLength(1);
    expect(replaced.optionGroups[0]?.name).toBe("Spice");
    expect(replaced.optionGroups[0]?.values[0]?.name).toBe("Hot");

    const clearRes = await app.request(`/v1/products/${productId}`, {
      method: "PATCH",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ options: [] }),
    });
    expect(clearRes.status).toBe(200);
    const cleared = (await clearRes.json()) as { optionGroups: unknown[] };
    expect(cleared.optionGroups).toHaveLength(0);
  });

  it("forbids managing options on a booth you do not own", async () => {
    const owner = await createUser();
    const other = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000 });

    const res = await app.request(`/v1/products/${productId}`, {
      method: "PATCH",
      headers: authHeaders(other.accessToken),
      body: JSON.stringify({
        options: [{ name: "Size", values: [{ name: "L" }] }],
      }),
    });
    expect(res.status).toBe(403);
  });
});

describe("menu soft-delete", () => {
  it("archives a product and hides it from the booth list", async () => {
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000 });

    const deleteRes = await app.request(`/v1/products/${productId}`, {
      method: "DELETE",
      headers: authHeaders(owner.accessToken),
    });
    expect(deleteRes.status).toBe(204);

    const listRes = await app.request(`/v1/booths/${boothId}/products`, {
      headers: authHeaders(owner.accessToken),
    });
    const products = (await listRes.json()) as unknown[];
    expect(products).toHaveLength(0);
  });
});

describe("booth product visibility", () => {
  it("hides hidden products from non-owners but shows them to the owner", async () => {
    const owner = await createUser();
    const other = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const availableId = await createProduct(boothId, { price: 1000 });
    const [hidden] = await getDb()
      .insert(products)
      .values({
        boothId,
        name: "Secret",
        price: 2000,
        stock: 5,
        status: "hidden",
      })
      .returning();

    const ownerRes = await app.request(`/v1/booths/${boothId}/products`, {
      headers: authHeaders(owner.accessToken),
    });
    expect(ownerRes.status).toBe(200);
    const ownerList = (await ownerRes.json()) as Array<{ id: string }>;
    expect(ownerList.map((p) => p.id).sort()).toEqual(
      [availableId, hidden?.id].sort(),
    );

    const otherRes = await app.request(`/v1/booths/${boothId}/products`, {
      headers: authHeaders(other.accessToken),
    });
    expect(otherRes.status).toBe(200);
    const otherList = (await otherRes.json()) as Array<{ id: string }>;
    expect(otherList.map((p) => p.id)).toEqual([availableId]);
  });
});

describe("sold-out products", () => {
  it("shows sold-out products to the kiosk but hides hidden ones", async () => {
    const owner = await createUser();
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);
    const availableId = await createProduct(boothId, { status: "available" });
    const soldoutId = await createProduct(boothId, { status: "soldout" });
    await createProduct(boothId, { status: "hidden" });

    const res = await app.request("/v1/kiosks/me/products", {
      headers: kioskHeaders(deviceToken),
    });
    expect(res.status).toBe(200);
    const list = (await res.json()) as Array<{ id: string; status: string }>;
    expect(list.map((p) => p.id).sort()).toEqual(
      [availableId, soldoutId].sort(),
    );
  });

  it("rejects orders for a sold-out product", async () => {
    const owner = await createUser();
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { status: "soldout" });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({ items: [{ productId, quantity: 1 }] }),
    });
    expect(orderRes.status).toBe(400);
  });

  it("accepts a product created with sold-out status", async () => {
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);

    const res = await app.request(`/v1/booths/${boothId}/products`, {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ name: "품절템", price: 3000, status: "soldout" }),
    });
    expect(res.status).toBe(201);
    const created = (await res.json()) as { status: string };
    expect(created.status).toBe("soldout");
  });
});

describe("response field exposure", () => {
  it("omits tokenHash from kiosk pairing and kiosk responses", async () => {
    const owner = await createUser();
    const [booth] = await getDb()
      .insert(booths)
      .values({ ownerId: owner.id, name: "Booth", status: "approved" })
      .returning();
    const pairRes = await app.request(`/v1/booths/${booth?.id}/kiosks`, {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ name: "Kiosk" }),
    });
    expect(pairRes.status).toBe(201);
    const paired = (await pairRes.json()) as {
      pairing: Record<string, unknown>;
      code: string;
    };
    expect(paired.pairing).not.toHaveProperty("codeHash");

    const claimRes = await app.request("/v1/kiosks/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: paired.code }),
    });
    expect(claimRes.status).toBe(201);
    const claimed = (await claimRes.json()) as {
      kiosk: Record<string, unknown>;
      deviceToken: string;
    };
    expect(claimed.kiosk).not.toHaveProperty("tokenHash");

    const meRes = await app.request("/v1/kiosks/me", {
      headers: kioskHeaders(claimed.deviceToken),
    });
    expect(meRes.status).toBe(200);
    const me = (await meRes.json()) as {
      kiosk: Record<string, unknown>;
      booth: Record<string, unknown>;
    };
    expect(me.kiosk).not.toHaveProperty("tokenHash");
    expect(me.booth).not.toHaveProperty("approvedBy");
  });

  it("omits codeHash from payment responses", async () => {
    const owner = await createUser();
    const { boothId, deviceToken } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000, stock: 5 });

    const orderRes = await app.request("/v1/orders", {
      method: "POST",
      headers: kioskHeaders(deviceToken),
      body: JSON.stringify({ items: [{ productId, quantity: 1 }] }),
    });
    const order = (await orderRes.json()) as { id: string };
    const payRes = await app.request(`/v1/orders/${order.id}/payments`, {
      method: "POST",
      headers: kioskHeaders(deviceToken),
    });
    expect(payRes.status).toBe(201);
    const created = (await payRes.json()) as {
      payment: Record<string, unknown>;
      code: string;
    };
    expect(created.payment).not.toHaveProperty("codeHash");

    const buyer = await createUser({ balance: 5000 });
    const viewRes = await app.request(`/v1/payment-codes/${created.code}`, {
      headers: authHeaders(buyer.accessToken),
    });
    expect(viewRes.status).toBe(200);
    const view = (await viewRes.json()) as {
      payment: Record<string, unknown>;
      booth: Record<string, unknown>;
    };
    expect(view.payment).not.toHaveProperty("codeHash");
    expect(view.booth).not.toHaveProperty("approvedBy");
  });

  it("omits internal fields from transaction responses", async () => {
    const admin = await createUser({ isAdmin: true });
    const user = await createUser();
    await app.request("/v1/charges", {
      method: "POST",
      headers: authHeaders(admin.accessToken),
      body: JSON.stringify({
        userId: user.id,
        amount: 500,
        idempotencyKey: "exposure-key",
      }),
    });
    const res = await app.request("/v1/users/me/transactions", {
      headers: authHeaders(user.accessToken),
    });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    for (const row of rows) {
      expect(row).not.toHaveProperty("idempotencyKey");
      expect(row).not.toHaveProperty("adminId");
      expect(row).not.toHaveProperty("refundedTransactionId");
    }
  });

  it("omits approvedBy from booth list", async () => {
    const admin = await createUser({ isAdmin: true });
    await getDb()
      .insert(booths)
      .values({ ownerId: admin.id, name: "Booth", status: "approved" });
    const res = await app.request("/v1/booths", {
      headers: authHeaders(admin.accessToken),
    });
    const list = (await res.json()) as Array<Record<string, unknown>>;
    for (const row of list) {
      expect(row).not.toHaveProperty("approvedBy");
    }
  });
});
