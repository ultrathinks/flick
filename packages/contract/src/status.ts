export const ORDER_STATUSES = [
  "pending",
  "paid",
  "canceled",
  "expired",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "completed",
  "expired",
  "canceled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PRODUCT_STATUSES = ["available", "soldout", "hidden"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const TRANSACTION_TYPES = [
  "grant",
  "charge",
  "purchase",
  "refund",
  "adjustment",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
