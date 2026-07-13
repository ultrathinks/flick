import { z } from "zod";

export const orderStatuses = [
  "pending",
  "paid",
  "canceled",
  "expired",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const adminOrderSchema = z.object({
  id: z.string(),
  boothId: z.string(),
  kioskId: z.string(),
  buyerId: z.string().nullable(),
  totalAmount: z.number(),
  status: z.enum(orderStatuses),
  paidAt: z.coerce.date().nullable(),
  canceledAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  boothName: z.string(),
  buyerName: z.string().nullable(),
});

export type AdminOrder = z.infer<typeof adminOrderSchema>;
