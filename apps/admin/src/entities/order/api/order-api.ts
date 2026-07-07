import { useCursorQuery } from "@/shared/api";
import { adminOrderSchema, type OrderStatus } from "../model/types.ts";

export function useOrders(filters: { status?: OrderStatus; boothId?: string }) {
  return useCursorQuery({
    queryKey: ["orders", filters.status ?? "all", filters.boothId ?? "all"],
    path: "orders",
    itemSchema: adminOrderSchema,
    searchParams: { status: filters.status, boothId: filters.boothId },
  });
}
