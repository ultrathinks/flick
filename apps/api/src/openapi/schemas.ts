import { z } from "@hono/zod-openapi";
import { createSelectSchema } from "drizzle-zod";
import {
  booths,
  kioskPairings,
  kiosks,
  orderItems,
  orders,
  payments,
  payouts,
  products,
  refunds,
  transactions,
} from "../db/schema/index.ts";

export const transactionSchema = z
  .object(createSelectSchema(transactions).shape)
  .openapi("Transaction");

export const boothSchema = z
  .object(createSelectSchema(booths).shape)
  .openapi("Booth");

export const productSchema = z
  .object(createSelectSchema(products).shape)
  .openapi("Product");

export const kioskSchema = z
  .object(createSelectSchema(kiosks).shape)
  .openapi("Kiosk");

export const kioskPairingSchema = z
  .object(createSelectSchema(kioskPairings).shape)
  .openapi("KioskPairing");

export const orderSchema = z
  .object(createSelectSchema(orders).shape)
  .openapi("Order");

export const orderItemSchema = z
  .object(createSelectSchema(orderItems).shape)
  .openapi("OrderItem");

export const paymentSchema = z
  .object(createSelectSchema(payments).shape)
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
    expiresAt: z.date(),
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
    amount: z.number(),
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
    amount: z.number(),
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

export const orderWithItemsSchema = z
  .object({ ...orderSchema.shape, items: z.array(orderItemSchema) })
  .openapi("OrderWithItems");

export const paymentCodeViewSchema = z
  .object({
    payment: paymentSchema,
    order: orderSchema,
    booth: boothSchema,
    items: z.array(orderItemSchema),
    balance: z.number(),
  })
  .openapi("PaymentCodeView");

export const paymentWithOrderSchema = z
  .object({ payment: paymentSchema, order: orderSchema })
  .openapi("PaymentWithOrder");

export const createPaymentSchema = z
  .object({ payment: paymentSchema, code: z.string() })
  .openapi("CreatePayment");
