import { z } from "zod";

export const statsSchema = z.object({
  totals: z.array(z.object({ type: z.string(), amount: z.number() })),
  boothSales: z.array(
    z.object({
      boothId: z.string(),
      name: z.string(),
      amount: z.number(),
    }),
  ),
});

export type Stats = z.infer<typeof statsSchema>;
export type TransactionType = "grant" | "charge" | "purchase" | "adjustment";
