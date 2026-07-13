import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
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

export const productStatus = pgEnum("product_status", [
  "available",
  "soldout",
  "hidden",
]);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "canceled",
  "expired",
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
  "adjustment",
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
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("booths_owner_id_idx").on(table.ownerId),
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
    stock: integer("stock"),
    status: productStatus("status").notNull().default("available"),
    autoSoldout: boolean("auto_soldout").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
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
    check(
      "products_stock_non_negative",
      sql`${table.stock} is null or ${table.stock} >= 0`,
    ),
    check("products_price_non_negative", sql`${table.price} >= 0`),
  ],
);

export const productOptionGroups = pgTable(
  "product_option_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    required: boolean("required").notNull().default(true),
    maxSelect: integer("max_select"),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_option_groups_product_id_idx").on(table.productId),
  ],
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => productOptionGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceDelta: bigint("price_delta", { mode: "number" }).notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("product_option_values_group_id_idx").on(table.groupId)],
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
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_booth_id_idx").on(table.boothId),
    index("orders_kiosk_id_idx").on(table.kioskId),
    index("orders_buyer_id_idx").on(table.buyerId),
    index("orders_created_at_id_idx").on(
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index("orders_status_created_at_id_idx").on(
      table.status,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index("orders_booth_created_at_id_idx").on(
      table.boothId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    check("orders_total_amount_non_negative", sql`${table.totalAmount} >= 0`),
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
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const orderItemOptions = pgTable(
  "order_item_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    groupName: text("group_name").notNull(),
    valueName: text("value_name").notNull(),
    priceDelta: bigint("price_delta", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_item_options_order_item_id_idx").on(table.orderItemId),
  ],
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
    check(
      "payments_expires_after_created",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
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
    uniqueIndex("transactions_one_grant_per_user_idx")
      .on(table.userId)
      .where(sql`${table.type} = 'grant'`),
    uniqueIndex("transactions_one_purchase_per_order_idx")
      .on(table.orderId)
      .where(sql`${table.type} = 'purchase'`),
  ],
);

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    bankName: text("bank_name").notNull(),
    accountNumber: text("account_number").notNull(),
    accountHolder: text("account_holder").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("payouts_user_id_idx").on(table.userId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
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
  },
  (table) => [
    index("audit_logs_created_at_id_idx").on(
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index("audit_logs_actor_created_at_id_idx").on(
      table.actorId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index("audit_logs_action_created_at_id_idx").on(
      table.action,
      table.createdAt.desc(),
      table.id.desc(),
    ),
  ],
);

export const boothsRelations = relations(booths, ({ one, many }) => ({
  owner: one(users, { fields: [booths.ownerId], references: [users.id] }),
  products: many(products),
  kiosks: many(kiosks),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  booth: one(booths, { fields: [products.boothId], references: [booths.id] }),
  optionGroups: many(productOptionGroups),
}));

export const productOptionGroupsRelations = relations(
  productOptionGroups,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productOptionGroups.productId],
      references: [products.id],
    }),
    values: many(productOptionValues),
  }),
);

export const productOptionValuesRelations = relations(
  productOptionValues,
  ({ one }) => ({
    group: one(productOptionGroups, {
      fields: [productOptionValues.groupId],
      references: [productOptionGroups.id],
    }),
  }),
);

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  options: many(orderItemOptions),
}));

export const orderItemOptionsRelations = relations(
  orderItemOptions,
  ({ one }) => ({
    orderItem: one(orderItems, {
      fields: [orderItemOptions.orderItemId],
      references: [orderItems.id],
    }),
  }),
);

export const kiosksRelations = relations(kiosks, ({ one }) => ({
  booth: one(booths, { fields: [kiosks.boothId], references: [booths.id] }),
}));

export type Booth = typeof booths.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductOptionGroup = typeof productOptionGroups.$inferSelect;
export type ProductOptionValue = typeof productOptionValues.$inferSelect;
export type OrderItemOption = typeof orderItemOptions.$inferSelect;
export type Kiosk = typeof kiosks.$inferSelect;
export type KioskPairing = typeof kioskPairings.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
