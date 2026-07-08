import { z } from "@hono/zod-openapi";
import { createSelectSchema } from "drizzle-zod";
import {
  booths,
  kioskPairings,
  kiosks,
  orderItemOptions,
  orderItems,
  orders,
  payments,
  payouts,
  productOptionGroups,
  productOptionValues,
  products,
  refunds,
  transactions,
} from "../db/schema/index.ts";
import {
  BOOTH_PUBLIC_OMIT,
  KIOSK_PAIRING_PUBLIC_OMIT,
  KIOSK_PUBLIC_OMIT,
  PAYMENT_PUBLIC_OMIT,
  TRANSACTION_PUBLIC_OMIT,
} from "./serializers.ts";

export const transactionSchema = z
  .object(createSelectSchema(transactions).omit(TRANSACTION_PUBLIC_OMIT).shape)
  .openapi("Transaction");

export const boothSchema = z
  .object(createSelectSchema(booths).omit(BOOTH_PUBLIC_OMIT).shape)
  .openapi("Booth");

export const productSchema = z
  .object(createSelectSchema(products).shape)
  .openapi("Product");

export const productOptionValueSchema = z
  .object(createSelectSchema(productOptionValues).shape)
  .openapi("ProductOptionValue");

export const productOptionGroupSchema = z
  .object(createSelectSchema(productOptionGroups).shape)
  .openapi("ProductOptionGroup");

export const productOptionGroupWithValuesSchema = z
  .object({
    ...productOptionGroupSchema.shape,
    values: z.array(productOptionValueSchema),
  })
  .openapi("ProductOptionGroupWithValues");

export const orderItemOptionSchema = z
  .object(createSelectSchema(orderItemOptions).shape)
  .openapi("OrderItemOption");

export const kioskSchema = z
  .object(createSelectSchema(kiosks).omit(KIOSK_PUBLIC_OMIT).shape)
  .openapi("Kiosk");

export const kioskPairingSchema = z
  .object(
    createSelectSchema(kioskPairings).omit(KIOSK_PAIRING_PUBLIC_OMIT).shape,
  )
  .openapi("KioskPairing");

export const orderSchema = z
  .object(createSelectSchema(orders).shape)
  .openapi("Order");

export const orderItemSchema = z
  .object(createSelectSchema(orderItems).shape)
  .openapi("OrderItem");

export const paymentSchema = z
  .object(createSelectSchema(payments).omit(PAYMENT_PUBLIC_OMIT).shape)
  .openapi("Payment");

export const refundSchema = z
  .object(createSelectSchema(refunds).shape)
  .openapi("Refund");

export const payoutSchema = z
  .object(createSelectSchema(payouts).shape)
  .openapi("Payout");

export const meSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    name: z.string(),
    profileImageUrl: z.string().nullable(),
    roles: z.array(z.string()),
    isAdmin: z.boolean(),
    studentNumber: z.string().nullable(),
    balance: z.number(),
  })
  .openapi("Me");

export const userCodeSchema = z
  .object({
    code: z.string(),
  })
  .openapi("UserCode");

export const sessionSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
  })
  .openapi("Session");

export const statsSchema = z
  .object({
    totals: z.array(
      z.object({
        type: z.string(),
        amount: z.number(),
      }),
    ),
    boothSales: z.array(
      z.object({
        boothId: z.string(),
        name: z.string(),
        amount: z.number(),
      }),
    ),
  })
  .openapi("Stats");

export const resolvedUserSchema = z
  .object({
    userId: z.string(),
    name: z.string(),
    roles: z.array(z.string()),
    studentNumber: z.string().nullable(),
    balance: z.number(),
  })
  .openapi("ResolvedUser");

export const payoutRequestSchema = z
  .object({
    id: z.string(),
    status: z.enum(["requested", "paid", "rejected"]),
    createdAt: z.date(),
  })
  .openapi("PayoutRequest");

export const payoutSummarySchema = z
  .object({
    availableAmount: z.number(),
    request: payoutRequestSchema.nullable(),
  })
  .openapi("PayoutSummary");

export const maskedPayoutSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    amount: z.number().nullable(),
    availableAmount: z.number(),
    status: z.enum(["requested", "paid", "rejected"]),
    accountHolder: z.string(),
    bankName: z.string(),
    accountNumber: z.string(),
    paidAt: z.date().nullable(),
    paidBy: z.string().nullable(),
    createdAt: z.date(),
  })
  .openapi("MaskedPayout");

export const payoutAccountSchema = z
  .object({
    bankName: z.string(),
    accountNumber: z.string(),
    accountHolder: z.string(),
  })
  .openapi("PayoutAccount");

export const orderItemWithOptionsSchema = z
  .object({
    ...orderItemSchema.shape,
    options: z.array(orderItemOptionSchema),
  })
  .openapi("OrderItemWithOptions");

export const orderWithItemsSchema = z
  .object({
    ...orderSchema.shape,
    items: z.array(orderItemWithOptionsSchema),
  })
  .openapi("OrderWithItems");

export const productWithOptionsSchema = z
  .object({
    ...productSchema.shape,
    optionGroups: z.array(productOptionGroupWithValuesSchema),
  })
  .openapi("ProductWithOptions");

export const paymentCodeViewSchema = z
  .object({
    payment: paymentSchema,
    order: orderSchema,
    booth: boothSchema,
    items: z.array(orderItemWithOptionsSchema),
    balance: z.number(),
  })
  .openapi("PaymentCodeView");

export const paymentWithOrderSchema = z
  .object({ payment: paymentSchema, order: orderSchema })
  .openapi("PaymentWithOrder");

export const createPaymentSchema = z
  .object({ payment: paymentSchema, code: z.string() })
  .openapi("CreatePayment");

export const adminUserSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    name: z.string(),
    profileImageUrl: z.string().nullable(),
    roles: z.array(z.string()),
    isAdmin: z.boolean(),
    studentNumber: z.string().nullable(),
    balance: z.number(),
    createdAt: z.date(),
  })
  .openapi("AdminUser");

export const adminUserPageSchema = z
  .object({
    items: z.array(adminUserSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi("AdminUserPage");

export const adminOrderSchema = z
  .object({
    ...orderSchema.shape,
    boothName: z.string(),
    buyerName: z.string().nullable(),
  })
  .openapi("AdminOrder");

export const adminOrderPageSchema = z
  .object({
    items: z.array(adminOrderSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi("AdminOrderPage");

export const auditLogSchema = z
  .object({
    id: z.string(),
    actorId: z.string(),
    actorName: z.string(),
    action: z.string(),
    targetType: z.string(),
    targetId: z.string(),
    metadata: z.unknown().nullable(),
    createdAt: z.date(),
  })
  .openapi("AuditLog");

export const auditLogPageSchema = z
  .object({
    items: z.array(auditLogSchema),
    nextCursor: z.string().nullable(),
  })
  .openapi("AuditLogPage");
