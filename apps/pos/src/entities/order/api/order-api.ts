import { z } from "zod";
import { request } from "@/shared/api";
import { type Order, orderSchema } from "../model/types.ts";

export function fetchBoothOrders(boothId: string): Promise<Order[]> {
  return request(z.array(orderSchema), `booths/${boothId}/orders`);
}
