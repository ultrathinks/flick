import { apiRequest } from "@/shared/api/client";
import type { Order, Payment } from "@/shared/api/types";

export type CreateOrderItem = {
  productId: string;
  quantity: number;
  optionValueIds?: string[];
};

export function createOrder(token: string, items: CreateOrderItem[]) {
  return apiRequest<Order>("/orders", {
    token,
    method: "POST",
    body: { items },
  });
}

export function cancelOrder(token: string, orderId: string) {
  return apiRequest<Order>(`/orders/${orderId}/cancel`, {
    token,
    method: "POST",
  });
}

export function createOrderPayment(token: string, orderId: string) {
  return apiRequest<{ payment: Payment; code: string }>(
    `/orders/${orderId}/payments`,
    { token, method: "POST" },
  );
}

export function fetchPayment(token: string, paymentId: string) {
  return apiRequest<{ payment: Payment; order: Order }>(
    `/payments/${paymentId}`,
    { token },
  );
}
