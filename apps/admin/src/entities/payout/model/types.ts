import { z } from "zod";

export const adminPayoutSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  studentNumber: z.string().nullable(),
  availableAmount: z.number(),
  accountHolder: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  createdAt: z.coerce.date(),
});

export type AdminPayout = z.infer<typeof adminPayoutSchema>;
