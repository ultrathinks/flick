import { useQuery } from "@tanstack/react-query";
import { fetchOrder } from "../api/payment-api.ts";

export const orderQueryKey = (orderId: string) => ["order", orderId] as const;

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderQueryKey(orderId),
    queryFn: () => fetchOrder(orderId),
  });
}
