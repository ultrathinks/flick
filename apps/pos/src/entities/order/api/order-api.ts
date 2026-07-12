import { z } from "zod";
import { request } from "@/shared/api";
import { type Order, orderSchema } from "../model/types.ts";

const boothOrdersSchema = z.object({
  items: z.array(orderSchema),
  nextCursor: z.string().nullable(),
});

export async function fetchBoothOrders(boothId: string): Promise<Order[]> {
  const page = await request(
    boothOrdersSchema,
    `booths/${boothId}/orders?limit=100`,
  );
  return page.items;
}
