export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type Kiosk = {
  id: string;
  boothId: string;
  name: string;
  revokedAt: string | null;
  createdAt: string;
};

export type Booth = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  boothId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
  status: "available" | "hidden";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  boothId: string;
  kioskId: string | null;
  buyerId: string | null;
  totalAmount: number;
  status: "pending" | "paid" | "canceled" | "refunded";
  paidAt: string | null;
  canceledAt: string | null;
  createdAt: string;
};

export type Payment = {
  id: string;
  orderId: string;
  status: "pending" | "completed" | "expired" | "canceled";
  expiresAt: string;
  completedAt: string | null;
};
