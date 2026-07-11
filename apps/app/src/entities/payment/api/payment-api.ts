import { request } from "@/shared/api";
import {
  type Order,
  type OrderWithItems,
  orderSchema,
  orderWithItemsSchema,
  type PaymentCodeView,
  paymentCodeViewSchema,
} from "../model/types.ts";

function encode(code: string): string {
  return encodeURIComponent(code);
}

export function fetchPaymentCodeView(code: string): Promise<PaymentCodeView> {
  return request(paymentCodeViewSchema, `payment-codes/${encode(code)}`);
}

export function confirmPaymentCode(code: string): Promise<Order> {
  return request(orderSchema, `payment-codes/${encode(code)}/confirm`, {
    method: "post",
  });
}

export function fetchOrder(orderId: string): Promise<OrderWithItems> {
  return request(orderWithItemsSchema, `orders/${encode(orderId)}`);
}
