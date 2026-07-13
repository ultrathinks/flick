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

export type OptionValue = {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  sortOrder: number;
};

export type OptionGroup = {
  id: string;
  productId: string;
  name: string;
  required: boolean;
  maxSelect: number | null;
  sortOrder: number;
  values: OptionValue[];
};

export type Product = {
  id: string;
  boothId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number | null;
  status: "available" | "soldout" | "hidden";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  optionGroups: OptionGroup[];
};

export type Order = {
  id: string;
  boothId: string;
  kioskId: string | null;
  buyerId: string | null;
  totalAmount: number;
  status: "pending" | "paid" | "canceled";
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
