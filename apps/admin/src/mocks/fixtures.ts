import type { z } from "zod";
import type { auditLogSchema } from "@/entities/audit";
import type { boothSchema } from "@/entities/booth";
import type { adminOrderSchema } from "@/entities/order/model/types.ts";
import type {
  maskedPayoutSchema,
  payoutAccountSchema,
} from "@/entities/payout";
import type { Stats } from "@/entities/stats";
import type { adminUserSchema } from "@/entities/user";
import type {
  chargeTransactionSchema,
  resolvedUserSchema,
} from "@/features/charge/api/charge.ts";
import type { meSchema } from "@/shared/auth/me.ts";

type Booth = z.input<typeof boothSchema>;
type AdminOrder = z.input<typeof adminOrderSchema>;
type AdminUser = z.input<typeof adminUserSchema>;
type MaskedPayout = z.input<typeof maskedPayoutSchema>;
type PayoutAccount = z.input<typeof payoutAccountSchema>;
type AuditLog = z.input<typeof auditLogSchema>;
type Me = z.input<typeof meSchema>;
type ResolvedUser = z.input<typeof resolvedUserSchema>;
type ChargeTransaction = z.input<typeof chargeTransactionSchema>;

export const me: Me = {
  id: "admin-1",
  username: "flick-admin",
  name: "관리자",
  profileImageUrl: null,
  roles: ["ADMIN"],
  isAdmin: true,
  studentNumber: null,
  balance: 0,
};

export const booths: Booth[] = [
  {
    id: "booth-1",
    ownerId: "owner-1",
    name: "떡볶이 부스",
    description: "매콤달콤 즉석 떡볶이",
    imageUrl: null,
    status: "pending",
    approvedAt: null,
    archivedAt: null,
    createdAt: "2026-06-28T12:00:00+09:00",
    updatedAt: "2026-06-28T12:00:00+09:00",
  },
  {
    id: "booth-2",
    ownerId: "owner-2",
    name: "음료 부스",
    description: "시원한 에이드",
    imageUrl: null,
    status: "approved",
    approvedAt: "2026-07-01T09:00:00+09:00",
    archivedAt: null,
    createdAt: "2026-06-27T10:00:00+09:00",
    updatedAt: "2026-07-01T09:00:00+09:00",
  },
];

export const orders: AdminOrder[] = [
  {
    id: "order-1",
    boothId: "booth-2",
    kioskId: "kiosk-1",
    buyerId: "buyer-1",
    totalAmount: 3500,
    status: "paid",
    paidAt: "2026-07-07T11:03:00+09:00",
    canceledAt: null,
    refundedAt: null,
    createdAt: "2026-07-07T11:02:00+09:00",
    boothName: "음료 부스",
    buyerName: "김학생",
  },
  {
    id: "order-2",
    boothId: "booth-2",
    kioskId: "kiosk-1",
    buyerId: null,
    totalAmount: 5000,
    status: "pending",
    paidAt: null,
    canceledAt: null,
    refundedAt: null,
    createdAt: "2026-07-07T11:05:00+09:00",
    boothName: "음료 부스",
    buyerName: null,
  },
];

export const users: AdminUser[] = [
  {
    id: "user-1",
    username: "student-a",
    name: "김학생",
    profileImageUrl: null,
    roles: ["STUDENT"],
    isAdmin: false,
    studentNumber: "2101",
    balance: 128000,
    createdAt: "2026-06-20T09:00:00+09:00",
  },
  {
    id: "user-2",
    username: "student-b",
    name: "이학생",
    profileImageUrl: null,
    roles: ["STUDENT"],
    isAdmin: false,
    studentNumber: "2102",
    balance: 42000,
    createdAt: "2026-06-21T09:00:00+09:00",
  },
];

export const payouts: MaskedPayout[] = [
  {
    id: "payout-1",
    userId: "user-1",
    amount: 128000,
    status: "requested",
    accountHolder: "김학생",
    bankName: "토스뱅크",
    accountNumber: "****3456",
    paidAt: null,
    paidBy: null,
    createdAt: "2026-07-07T18:00:00+09:00",
  },
];

export const payoutAccount: PayoutAccount = {
  bankName: "토스뱅크",
  accountNumber: "100012345678",
  accountHolder: "김학생",
};

export const auditLogs: AuditLog[] = [
  {
    id: "audit-1",
    actorId: me.id,
    actorName: me.name,
    action: "booth.approve",
    targetType: "booth",
    targetId: "booth-2",
    metadata: null,
    createdAt: "2026-07-01T09:00:00+09:00",
  },
  {
    id: "audit-2",
    actorId: me.id,
    actorName: me.name,
    action: "charge.create",
    targetType: "user",
    targetId: "user-1",
    metadata: { amount: 50000 },
    createdAt: "2026-07-05T10:00:00+09:00",
  },
];

export const stats: Stats = {
  totals: [
    { type: "charge", amount: 500000 },
    { type: "purchase", amount: 320000 },
    { type: "payout", amount: 128000 },
  ],
  boothSales: [
    { boothId: "booth-2", name: "음료 부스", amount: 220000 },
    { boothId: "booth-1", name: "떡볶이 부스", amount: 100000 },
  ],
};

export const resolvedUser: ResolvedUser = {
  userId: "user-1",
  name: "김학생",
  roles: ["STUDENT"],
  studentNumber: "2101",
  balance: 128000,
};

export const chargeTransaction: ChargeTransaction = {
  id: "charge-1",
  userId: "user-1",
  amount: 50000,
  type: "charge",
  createdAt: "2026-07-08T10:00:00+09:00",
};
