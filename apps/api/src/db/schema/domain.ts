import { relations, sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const boothStatus = pgEnum("booth_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
]);

export const productStatus = pgEnum("product_status", ["available", "hidden"]);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "canceled",
  "expired",
  "refunded",
]);

export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "completed",
  "expired",
  "canceled",
]);

export const transactionType = pgEnum("transaction_type", [
  "grant",
  "charge",
  "purchase",
  "refund",
  "payout",
  "adjustment",
]);

export const payoutStatus = pgEnum("payout_status", [
  "requested",
  "paid",
  "rejected",
]);

export const booths = pgTable(
  "booths",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    status: boothStatus("status").notNull().default("pending"),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("booths_owner_id_idx").on(table.ownerId),
    index("booths_status_idx").on(table.status),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boothId: uuid("booth_id")
      .notNull()
      .references(() => booths.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    price: bigint("price", { mode: "number" }).notNull(),
    stock: integer("stock").notNull(),
    status: productStatus("status").notNull().default("available"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_booth_id_idx").on(table.boothId),
    index("products_status_idx").on(table.status),
  ],
);

export const kiosks = pgTable(
  "kiosks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boothId: uuid("booth_id")
      .notNull()
      .references(() => booths.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("kiosks_booth_id_idx").on(table.boothId)],
);

export const kioskPairings = pgTable(
  "kiosk_pairings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boothId: uuid("booth_id")
      .notNull()
      .references(() => booths.id, { onDelete: "cascade" }),
    kioskName: text("kiosk_name").notNull(),
    codeHash: text("code_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("kiosk_pairings_booth_id_idx").on(table.boothId)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boothId: uuid("booth_id")
      .notNull()
      .references(() => booths.id),
    kioskId: uuid("kiosk_id")
      .notNull()
      .references(() => kiosks.id),
    buyerId: uuid("buyer_id").references(() => users.id),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
    status: orderStatus("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_booth_id_idx").on(table.boothId),
    index("orders_kiosk_id_idx").on(table.kioskId),
    index("orders_buyer_id_idx").on(table.buyerId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    name: text("name").notNull(),
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
    quantity: integer("quantity").notNull(),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull().unique(),
    status: paymentStatus("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    confirmedBy: uuid("confirmed_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_order_id_idx").on(table.orderId),
    uniqueIndex("payments_one_pending_per_order_idx")
      .on(table.orderId)
      .where(sql`${table.status} = 'pending'`),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    amount: bigint("amount", { mode: "number" }).notNull(),
    type: transactionType("type").notNull(),
    orderId: uuid("order_id").references(() => orders.id),
    paymentId: uuid("payment_id").references(() => payments.id),
    adminId: uuid("admin_id").references(() => users.id),
    idempotencyKey: text("idempotency_key"),
    refundedTransactionId: uuid("refunded_transaction_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("transactions_user_id_idx").on(table.userId),
    index("transactions_order_id_idx").on(table.orderId),
    index("transactions_payment_id_idx").on(table.paymentId),
    uniqueIndex("transactions_admin_idempotency_idx")
      .on(table.adminId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
    uniqueIndex("transactions_refunded_transaction_idx")
      .on(table.refundedTransactionId)
      .where(sql`${table.refundedTransactionId} is not null`),
    uniqueIndex("transactions_one_grant_per_user_idx")
      .on(table.userId)
      .where(sql`${table.type} = 'grant'`),
  ],
);

export const userCodes = pgTable(
  "user_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull().unique(),
    codeEncrypted: text("code_encrypted").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_codes_user_id_idx").on(table.userId),
    uniqueIndex("user_codes_one_active_per_user_idx")
      .on(table.userId)
      .where(sql`${table.revokedAt} is null`),
  ],
);

export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id),
  paymentTransactionId: uuid("payment_transaction_id")
    .notNull()
    .references(() => transactions.id),
  refundTransactionId: uuid("refund_transaction_id")
    .notNull()
    .references(() => transactions.id),
  amount: bigint("amount", { mode: "number" }).notNull(),
  reason: text("reason"),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    amount: bigint("amount", { mode: "number" }).notNull(),
    bankName: text("bank_name").notNull(),
    accountNumber: text("account_number").notNull(),
    accountHolder: text("account_holder").notNull(),
    status: payoutStatus("status").notNull().default("requested"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidBy: uuid("paid_by").references(() => users.id),
    payoutTransactionId: uuid("payout_transaction_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payouts_user_id_idx").on(table.userId),
    uniqueIndex("payouts_one_requested_per_user_idx")
      .on(table.userId)
      .where(sql`${table.status} = 'requested'`),
  ],
);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const boothsRelations = relations(booths, ({ one, many }) => ({
  owner: one(users, { fields: [booths.ownerId], references: [users.id] }),
  products: many(products),
  kiosks: many(kiosks),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one }) => ({
  booth: one(booths, { fields: [products.boothId], references: [booths.id] }),
}));

export const kiosksRelations = relations(kiosks, ({ one }) => ({
  booth: one(booths, { fields: [kiosks.boothId], references: [booths.id] }),
}));

export type Booth = typeof booths.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Kiosk = typeof kiosks.$inferSelect;
export type KioskPairing = typeof kioskPairings.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
