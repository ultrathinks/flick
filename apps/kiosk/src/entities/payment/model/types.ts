export type PaymentSnapshot = {
  orderId: string | null;
  paymentId: string | null;
  code: string | null;
  expiresAt: string | null;
  totalAmount: number;
};
