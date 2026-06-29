import { z } from "zod";

export const orderStatusSchema = z.enum([
  "pending",
  "paid",
  "canceled",
  "expired",
  "refunded",
]);

export const orderSchema = z.object({
  id: z.string(),
  boothId: z.string(),
  kioskId: z.string(),
  buyerId: z.string().nullable(),
  totalAmount: z.number(),
  status: orderStatusSchema,
  paidAt: z.string().nullable(),
  canceledAt: z.string().nullable(),
  refundedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type Order = z.infer<typeof orderSchema>;
