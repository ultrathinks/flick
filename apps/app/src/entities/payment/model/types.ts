import { z } from "zod";

export const orderStatus = z.enum(["pending", "paid", "canceled", "expired"]);

export const paymentStatus = z.enum([
  "pending",
  "completed",
  "expired",
  "canceled",
]);

export const boothStatus = z.enum(["draft", "pending", "approved", "rejected"]);

export const paymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  status: paymentStatus,
  expiresAt: z.string(),
  completedAt: z.string().nullable(),
  confirmedBy: z.string().nullable(),
  createdAt: z.string(),
});

export const orderSchema = z.object({
  id: z.string(),
  boothId: z.string(),
  kioskId: z.string(),
  buyerId: z.string().nullable(),
  totalAmount: z.number(),
  status: orderStatus,
  paidAt: z.string().nullable(),
  canceledAt: z.string().nullable(),
  createdAt: z.string(),
});

export const boothSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  status: boothStatus,
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  name: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  totalAmount: z.number(),
});

export const paymentCodeViewSchema = z.object({
  payment: paymentSchema,
  order: orderSchema,
  booth: boothSchema,
  items: z.array(orderItemSchema),
  balance: z.number(),
});

export const orderWithItemsSchema = z.object({
  ...orderSchema.shape,
  items: z.array(orderItemSchema),
});

export type Payment = z.infer<typeof paymentSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Booth = z.infer<typeof boothSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type PaymentCodeView = z.infer<typeof paymentCodeViewSchema>;
export type OrderWithItems = z.infer<typeof orderWithItemsSchema>;
