import { z } from "zod";

export const payoutStatuses = ["requested", "paid", "rejected"] as const;

export type PayoutStatus = (typeof payoutStatuses)[number];

export const maskedPayoutSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  status: z.enum(payoutStatuses),
  accountHolder: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  paidAt: z.coerce.date().nullable(),
  paidBy: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const payoutAccountSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  accountHolder: z.string(),
});

export type MaskedPayout = z.infer<typeof maskedPayoutSchema>;
export type PayoutAccount = z.infer<typeof payoutAccountSchema>;
