import type { CartItem } from "@/entities/cart/model/types";

export type PaymentSnapshot = {
  orderId: string | null;
  paymentId: string | null;
  code: string | null;
  expiresAt: string | null;
  totalAmount: number;
  items: CartItem[];
};
