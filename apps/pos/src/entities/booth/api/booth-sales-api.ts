import { z } from "zod";
import { request } from "@/shared/api";

export const boothSalesSchema = z.object({
  paidCount: z.number(),
  paidRevenue: z.number(),
  refundedCount: z.number(),
  refundedRevenue: z.number(),
});

export type BoothSales = z.infer<typeof boothSalesSchema>;

export function fetchBoothSales(boothId: string): Promise<BoothSales> {
  return request(boothSalesSchema, `booths/${boothId}/sales`);
}
