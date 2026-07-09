export type CartLineOption = {
  groupName: string;
  valueName: string;
  priceDelta: number;
};

export type CartItem = {
  lineId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  optionValueIds: string[];
  options: CartLineOption[];
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
