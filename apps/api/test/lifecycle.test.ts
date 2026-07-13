import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.ts";
import { getDb } from "../src/db/index.ts";
import { transactions, users } from "../src/db/schema/index.ts";
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

async function ledgerOf(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ sum: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(eq(transactions.userId, userId));
  return Number(row?.sum ?? 0);
}

async function expectBalanceMatchesLedger(userId: string): Promise<number> {
  const [balance, ledger] = await Promise.all([
    balanceOf(userId),
    ledgerOf(userId),
  ]);
  expect(balance).toBe(ledger);
  return balance;
}

describe("full money lifecycle keeps balance equal to the ledger", () => {
  it("holds the invariant across charge and purchase", async () => {
    const admin = await createUser({ isAdmin: true });
    const owner = await createUser();
    const buyer = await createUser({ balance: 10000 });
    const { boothId, kioskId } = await createBoothWithKiosk(owner.id);
    const productId = await createProduct(boothId, { price: 2000, stock: 5 });

    expect(await expectBalanceMatchesLedger(buyer.id)).toBe(10000);

    const charge = await app.request("/v1/charges", {
      method: "POST",
      headers: authHeaders(admin.accessToken),
      body: JSON.stringify({
        userId: buyer.id,
        amount: 5000,
        idempotencyKey: "life-charge",
      }),
    });
    expect(charge.status).toBe(201);
    expect(await expectBalanceMatchesLedger(buyer.id)).toBe(15000);

    const { code } = await createOrderWithPayment(boothId, kioskId, productId, {
      price: 2000,
    });
    const confirm = await app.request(`/v1/payment-codes/${code}/confirm`, {
      method: "POST",
      headers: authHeaders(buyer.accessToken),
    });
    expect(confirm.status).toBe(200);
    expect(await expectBalanceMatchesLedger(buyer.id)).toBe(13000);
  });
});
