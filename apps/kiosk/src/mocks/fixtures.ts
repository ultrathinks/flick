import type { Booth, Kiosk, Order, Payment, Product } from "@/shared/api/types";

export const kiosk: Kiosk = {
  id: "kiosk_1",
  boothId: "booth_1",
  name: "1번 키오스크",
  revokedAt: null,
  createdAt: "2026-07-01T00:00:00.000Z",
};

export const booth: Booth = {
  id: "booth_1",
  name: "떡볶이 부스",
  description: "학교 축제 떡볶이 부스",
  status: "open",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

export const products: Product[] = [
  {
    id: "prod_1",
    boothId: "booth_1",
    name: "국물 떡볶이",
    description: "매콤달콤 국물 떡볶이",
    imageUrl: null,
    price: 4000,
    stock: 12,
    status: "available",
    sortOrder: 1,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "prod_2",
    boothId: "booth_1",
    name: "치즈 떡볶이",
    description: "모짜렐라 듬뿍",
    imageUrl: null,
    price: 5500,
    stock: 3,
    status: "available",
    sortOrder: 2,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "prod_3",
    boothId: "booth_1",
    name: "순대",
    description: "찹쌀 순대 한 접시",
    imageUrl: null,
    price: 4500,
    stock: 8,
    status: "available",
    sortOrder: 3,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "prod_4",
    boothId: "booth_1",
    name: "튀김 모둠",
    description: "오징어·야채·김말이",
    imageUrl: null,
    price: 5000,
    stock: 0,
    status: "available",
    sortOrder: 4,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "prod_5",
    boothId: "booth_1",
    name: "어묵 국물",
    description: "따끈한 어묵과 국물",
    imageUrl: null,
    price: 2000,
    stock: 25,
    status: "available",
    sortOrder: 5,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "prod_6",
    boothId: "booth_1",
    name: "콜라",
    description: "시원한 탄산음료",
    imageUrl: null,
    price: 2000,
    stock: 40,
    status: "available",
    sortOrder: 6,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
];

export function makeOrder(totalAmount: number): Order {
  return {
    id: "order_mock",
    boothId: "booth_1",
    kioskId: "kiosk_1",
    buyerId: null,
    totalAmount,
    status: "pending",
    paidAt: null,
    canceledAt: null,
    createdAt: new Date().toISOString(),
  };
}

export function makePayment(expiresInMs: number): Payment {
  return {
    id: "payment_mock",
    orderId: "order_mock",
    status: "pending",
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    completedAt: null,
  };
}
