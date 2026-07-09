export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type PaymentSnapshot = {
  orderId: string | null;
  paymentId: string | null;
  code: string | null;
  expiresAt: string | null;
  totalAmount: number;
  items: CartItem[];
};

export type KioskSession = {
  token: string | null;
};
