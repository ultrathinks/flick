import { z } from "zod";

export const transactionType = z.enum([
  "grant",
  "charge",
  "purchase",
  "adjustment",
]);

export type TransactionType = z.infer<typeof transactionType>;

export const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  type: transactionType,
  orderId: z.string().nullable(),
  paymentId: z.string().nullable(),
  createdAt: z.string(),
});

export type Transaction = z.infer<typeof transactionSchema>;
