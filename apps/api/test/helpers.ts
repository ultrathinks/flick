import { eq, sql } from "drizzle-orm";
import { issueSession } from "../src/auth/session.ts";
import { getDb } from "../src/db/index.ts";
import {
  booths,
  kiosks,
  orderItems,
  orders,
  payments,
  products,
  transactions,
  users,
} from "../src/db/schema/index.ts";
import { generateSecret, hashSecret } from "../src/lib/security.ts";

let seq = 0;

export async function resetDb(): Promise<void> {
  await getDb().execute(
    sql`truncate audit_logs, payouts, refunds, transactions, payments, order_items, orders, products, kiosks, kiosk_pairings, user_codes, sessions, users restart identity cascade`,
  );
}

export async function createUser(options?: {
  isAdmin?: boolean;
  balance?: number;
}): Promise<{ id: string; accessToken: string }> {
  seq += 1;
  const [user] = await getDb()
    .insert(users)
    .values({
      dauthPublicId: `pub-${seq}-${generateSecret(6)}`,
      username: `user${seq}`,
      name: `User ${seq}`,
      roles: ["STUDENT"],
      isAdmin: options?.isAdmin ?? false,
      balance: 0,
    })
    .returning();
  if (!user) {
    throw new Error("failed to seed user");
  }
  await getDb().insert(transactions).values({
    userId: user.id,
    amount: 1000,
    type: "grant",
  });
  const balance = options?.balance ?? 1000;
  if (balance !== 1000) {
    await getDb()
      .insert(transactions)
      .values({
        userId: user.id,
        amount: balance - 1000,
        type: "charge",
      });
  }
  await getDb().update(users).set({ balance }).where(eq(users.id, user.id));
  const session = await issueSession(user.id);
  return { id: user.id, accessToken: session.accessToken };
}

export async function createBoothWithKiosk(ownerId: string): Promise<{
  boothId: string;
  kioskId: string;
  deviceToken: string;
}> {
  const [booth] = await getDb()
    .insert(booths)
    .values({ ownerId, name: "Booth", status: "approved" })
    .returning();
  if (!booth) {
    throw new Error("failed to seed booth");
  }
  const deviceToken = generateSecret();
  const [kiosk] = await getDb()
    .insert(kiosks)
    .values({
      boothId: booth.id,
      name: "Kiosk",
      tokenHash: hashSecret(deviceToken),
    })
    .returning();
  if (!kiosk) {
    throw new Error("failed to seed kiosk");
  }
  return { boothId: booth.id, kioskId: kiosk.id, deviceToken };
}

export async function createProduct(
  boothId: string,
  options?: { price?: number; stock?: number },
): Promise<string> {
  const [product] = await getDb()
    .insert(products)
    .values({
      boothId,
      name: "Item",
      price: options?.price ?? 1000,
      stock: options?.stock ?? 10,
    })
    .returning();
  if (!product) {
    throw new Error("failed to seed product");
  }
  return product.id;
}

export async function createOrderWithPayment(
  boothId: string,
  kioskId: string,
  productId: string,
  options?: { price?: number; quantity?: number },
): Promise<{ orderId: string; paymentId: string; code: string }> {
  const price = options?.price ?? 1000;
  const quantity = options?.quantity ?? 1;
  const total = price * quantity;
  const [order] = await getDb()
    .insert(orders)
    .values({ boothId, kioskId, totalAmount: total })
    .returning();
  if (!order) {
    throw new Error("failed to seed order");
  }
  await getDb().insert(orderItems).values({
    orderId: order.id,
    productId,
    name: "Item",
    unitPrice: price,
    quantity,
    totalAmount: total,
  });
  const code = generateSecret(24);
  const [payment] = await getDb()
    .insert(payments)
    .values({
      orderId: order.id,
      codeHash: hashSecret(code),
      expiresAt: new Date(Date.now() + 3 * 60 * 1000),
    })
    .returning();
  if (!payment) {
    throw new Error("failed to seed payment");
  }
  return { orderId: order.id, paymentId: payment.id, code };
}

export function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function kioskHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
