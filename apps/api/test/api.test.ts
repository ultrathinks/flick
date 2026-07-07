import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.ts";
import { getDb } from "../src/db/index.ts";
import {
  booths,
  payouts,
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
});

describe("payout", () => {
  it("requests once and pays out with ledger debit", async () => {
    const admin = await createUser({ isAdmin: true });
    const user = await createUser({ balance: 5000 });

    const reqRes = await app.request("/v1/users/me/payout", {
      method: "POST",
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        bankName: "Bank",
        accountNumber: "1234567890",
        accountHolder: "User",
      }),
    });
    expect(reqRes.status).toBe(201);
    const payout = (await reqRes.json()) as { id: string; amount: number };
    expect(payout.amount).toBe(4000);

    const dupe = await app.request("/v1/users/me/payout", {
      method: "POST",
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        bankName: "Bank",
        accountNumber: "1234567890",
        accountHolder: "User",
      }),
    });
    expect(dupe.status).toBe(409);

    const payRes = await app.request(`/v1/payouts/${payout.id}/pay`, {
      method: "POST",
      headers: authHeaders(admin.accessToken),
    });
    expect(payRes.status).toBe(200);
    expect(await balanceOf(user.id)).toBe(1000);
    expect(await ledgerOf(user.id)).toBe(1000);
  });

  it("masks account number in admin list", async () => {
    const admin = await createUser({ isAdmin: true });
    const user = await createUser({ balance: 5000 });
    await app.request("/v1/users/me/payout", {
      method: "POST",
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
    const list = (await res.json()) as Array<{ accountNumber: string }>;
    expect(list[0]?.accountNumber).toBe("******7890");
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
  it("creates and lists option groups with values, archives on delete", async () => {
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000 });

    const groupRes = await app.request(
      `/v1/products/${productId}/option-groups`,
      {
        method: "POST",
        headers: authHeaders(owner.accessToken),
        body: JSON.stringify({ name: "Size" }),
      },
    );
    expect(groupRes.status).toBe(201);
    const group = (await groupRes.json()) as { id: string };

    const valueRes = await app.request(`/v1/option-groups/${group.id}/values`, {
      method: "POST",
      headers: authHeaders(owner.accessToken),
      body: JSON.stringify({ name: "L", priceDelta: 500, isDefault: true }),
    });
    expect(valueRes.status).toBe(201);

    const listRes = await app.request(`/v1/products/${productId}/options`, {
      headers: authHeaders(owner.accessToken),
    });
    expect(listRes.status).toBe(200);
    const groups = (await listRes.json()) as Array<{
      id: string;
      values: Array<{ name: string; priceDelta: number; isDefault: boolean }>;
    }>;
    expect(groups).toHaveLength(1);
    expect(groups[0]?.values[0]?.name).toBe("L");
    expect(groups[0]?.values[0]?.isDefault).toBe(true);

    const deleteRes = await app.request(`/v1/option-groups/${group.id}`, {
      method: "DELETE",
      headers: authHeaders(owner.accessToken),
    });
    expect(deleteRes.status).toBe(204);

    const afterRes = await app.request(`/v1/products/${productId}/options`, {
      headers: authHeaders(owner.accessToken),
    });
    const after = (await afterRes.json()) as unknown[];
    expect(after).toHaveLength(0);
  });

  it("forbids managing options on a booth you do not own", async () => {
    const owner = await createUser();
    const other = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 1000 });

    const res = await app.request(`/v1/products/${productId}/option-groups`, {
      method: "POST",
      headers: authHeaders(other.accessToken),
      body: JSON.stringify({ name: "Size" }),
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

describe("payout reject guard", () => {
  it("rejects a requested payout and blocks rejecting a paid one", async () => {
    const admin = await createUser({ isAdmin: true });
    const user = await createUser({ balance: 5000 });
    const reqRes = await app.request("/v1/users/me/payout", {
      method: "POST",
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        bankName: "Bank",
        accountNumber: "1234567890",
        accountHolder: "User",
      }),
    });
    const payout = (await reqRes.json()) as { id: string };

    const payRes = await app.request(`/v1/payouts/${payout.id}/pay`, {
      method: "POST",
      headers: authHeaders(admin.accessToken),
    });
    expect(payRes.status).toBe(200);

    const rejectRes = await app.request(`/v1/payouts/${payout.id}/reject`, {
      method: "POST",
      headers: authHeaders(admin.accessToken),
    });
    expect(rejectRes.status).toBe(409);
    const [row] = await getDb()
      .select()
      .from(payouts)
      .where(eq(payouts.id, payout.id));
    expect(row?.status).toBe("paid");
  });

  it("rejects a requested payout", async () => {
    const admin = await createUser({ isAdmin: true });
    const user = await createUser({ balance: 5000 });
    const reqRes = await app.request("/v1/users/me/payout", {
      method: "POST",
      headers: authHeaders(user.accessToken),
      body: JSON.stringify({
        bankName: "Bank",
        accountNumber: "1234567890",
        accountHolder: "User",
      }),
    });
    const payout = (await reqRes.json()) as { id: string };
    const rejectRes = await app.request(`/v1/payouts/${payout.id}/reject`, {
      method: "POST",
      headers: authHeaders(admin.accessToken),
    });
    expect(rejectRes.status).toBe(200);
    expect(await balanceOf(user.id)).toBe(5000);
  });
});
