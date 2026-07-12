import { z } from "zod";

export const reportSchema = z.object({
  summary: z.object({
    totalCharged: z.number(),
    totalRevenue: z.number(),
    netDonation: z.number(),
    userCount: z.number(),
    orderCount: z.number(),
    refundableTotal: z.number(),
    unregisteredCount: z.number(),
    unregisteredTotal: z.number(),
    reconciliation: z.number(),
  }),
  boothRanking: z.array(
    z.object({
      name: z.string(),
      revenue: z.number(),
    }),
  ),
  menuSales: z.array(
    z.object({
      boothName: z.string(),
      menuName: z.string(),
      quantity: z.number(),
      revenue: z.number(),
    }),
  ),
  unregistered: z.array(
    z.object({
      name: z.string(),
      studentNumber: z.string().nullable(),
      amount: z.number(),
    }),
  ),
  ledger: z.array(
    z.object({
      createdAt: z.coerce.date(),
      userName: z.string(),
      studentNumber: z.string().nullable(),
      type: z.string(),
      amount: z.number(),
    }),
  ),
});

export type Report = z.infer<typeof reportSchema>;
export type ReportSummary = Report["summary"];
export type BoothRanking = Report["boothRanking"][number];
export type MenuSale = Report["menuSales"][number];
