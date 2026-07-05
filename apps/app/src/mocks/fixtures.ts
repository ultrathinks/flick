import type {
  Booth,
  Order,
  OrderItem,
  OrderWithItems,
  Payment,
  PaymentCodeView,
} from "@/entities/payment";
import type { Session } from "@/entities/session";
import type { Transaction } from "@/entities/transaction";
import type { Me } from "@/entities/user";
import type { UserCode } from "@/entities/user-code";

export const me: Me = {
  id: "user-1",
  username: "flick",
  name: "김플릭",
  profileImageUrl: null,
  roles: ["STUDENT"],
  isAdmin: false,
  studentNumber: "2101",
  balance: 128000,
};

export const transactions: Transaction[] = [
  {
    id: "tx-1",
    userId: "user-1",
    amount: -3500,
    type: "purchase",
    orderId: "order-1",
    paymentId: "pay-1",
    createdAt: "2026-07-05T11:03:00+09:00",
  },
  {
    id: "tx-2",
    userId: "user-1",
    amount: 50000,
    type: "charge",
    orderId: null,
    paymentId: null,
    createdAt: "2026-07-05T10:12:00+09:00",
  },
  {
    id: "tx-3",
    userId: "user-1",
    amount: -2500,
    type: "purchase",
    orderId: "order-2",
    paymentId: "pay-2",
    createdAt: "2026-07-04T18:20:00+09:00",
  },
  {
    id: "tx-4",
    userId: "user-1",
    amount: 100000,
    type: "grant",
    orderId: null,
    paymentId: null,
    createdAt: "2026-07-01T09:00:00+09:00",
  },
];

export const userCode: UserCode = {
  code: "FLICK-4821-9930",
  expiresAt: "2026-07-05T12:05:00+09:00",
};

const booth: Booth = {
  id: "booth-1",
  ownerId: "owner-1",
  name: "떡볶이 부스",
  description: "학생회 인기 부스",
  imageUrl: null,
  status: "approved",
  approvedAt: "2026-07-01T00:00:00+09:00",
  createdAt: "2026-07-01T00:00:00+09:00",
  updatedAt: "2026-07-01T00:00:00+09:00",
};

const items: OrderItem[] = [
  {
    id: "item-1",
    orderId: "order-1",
    productId: "prod-1",
    name: "떡볶이",
    unitPrice: 3500,
    quantity: 1,
    totalAmount: 3500,
  },
  {
    id: "item-2",
    orderId: "order-1",
    productId: "prod-2",
    name: "순대",
    unitPrice: 2500,
    quantity: 1,
    totalAmount: 2500,
  },
];

export const order: Order = {
  id: "order-1",
  boothId: "booth-1",
  kioskId: "kiosk-1",
  buyerId: "user-1",
  totalAmount: 6000,
  status: "pending",
  paidAt: null,
  canceledAt: null,
  refundedAt: null,
  createdAt: "2026-07-05T11:00:00+09:00",
};

export const orderWithItems: OrderWithItems = { ...order, items };

export const session: Session = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  expiresIn: 3600,
};

export function paymentCodeView(): PaymentCodeView {
  const payment: Payment = {
    id: "pay-1",
    orderId: "order-1",
    status: "pending",
    expiresAt: new Date(Date.now() + 180_000).toISOString(),
    completedAt: null,
    confirmedBy: null,
    createdAt: "2026-07-05T11:00:00+09:00",
  };
  return { payment, order, booth, items, balance: me.balance };
}
