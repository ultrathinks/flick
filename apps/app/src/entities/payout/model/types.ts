import { z } from "zod";

export const payoutAccountSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  accountHolder: z.string(),
});

export const payoutSummarySchema = z.object({
  availableAmount: z.number(),
  account: payoutAccountSchema.nullable(),
});

export type PayoutAccount = z.infer<typeof payoutAccountSchema>;
export type PayoutSummary = z.infer<typeof payoutSummarySchema>;
