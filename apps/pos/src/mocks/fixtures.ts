import type { Booth } from "@/entities/booth";
import type { BoothKiosks } from "@/entities/kiosk";
import type { Order } from "@/entities/order";
import type { Product } from "@/entities/product";

export interface Me {
  id: string;
  username: string;
  name: string;
}

export const me: Me = {
  id: "owner-1",
  username: "booth-owner",
  name: "김부스",
};

export const booth: Booth = {
  id: "booth-1",
  ownerId: me.id,
  name: "떡볶이 부스",
  description: "매콤달콤 즉석 떡볶이",
  imageUrl: null,
  status: "approved",
  approvedAt: "2026-07-01T09:00:00+09:00",
  archivedAt: null,
  createdAt: "2026-06-28T12:00:00+09:00",
  updatedAt: "2026-07-01T09:00:00+09:00",
};

export const products: Product[] = [
  {
    id: "product-1",
    boothId: booth.id,
    name: "국물 떡볶이",
    description: "기본 국물 떡볶이",
    imageUrl: null,
    price: 3000,
    stock: null,
    status: "available",
    sortOrder: 0,
    archivedAt: null,
    createdAt: "2026-06-28T12:10:00+09:00",
    updatedAt: "2026-06-28T12:10:00+09:00",
    optionGroups: [
      {
        id: "group-1",
        productId: "product-1",
        name: "맵기",
        required: true,
        maxSelect: 1,
        sortOrder: 0,
        archivedAt: null,
        createdAt: "2026-06-28T12:20:00+09:00",
        values: [
          {
            id: "value-1",
            groupId: "group-1",
            name: "순한맛",
            priceDelta: 0,
            isDefault: true,
            sortOrder: 0,
            archivedAt: null,
            createdAt: "2026-06-28T12:20:00+09:00",
          },
          {
            id: "value-2",
            groupId: "group-1",
            name: "매운맛",
            priceDelta: 0,
            isDefault: false,
            sortOrder: 1,
            archivedAt: null,
            createdAt: "2026-06-28T12:20:00+09:00",
          },
        ],
      },
    ],
  },
  {
    id: "product-2",
    boothId: booth.id,
    name: "치즈 떡볶이",
    description: "모짜렐라 듬뿍",
    imageUrl: null,
    price: 2500,
    stock: 20,
    status: "soldout",
    sortOrder: 1,
    archivedAt: null,
    createdAt: "2026-06-28T12:11:00+09:00",
    updatedAt: "2026-06-28T12:11:00+09:00",
    optionGroups: [],
  },
  {
    id: "product-3",
    boothId: booth.id,
    name: "김말이 튀김",
    description: "바삭한 김말이",
    imageUrl: null,
    price: 2000,
    stock: null,
    status: "hidden",
    sortOrder: 2,
    archivedAt: null,
    createdAt: "2026-06-28T12:12:00+09:00",
    updatedAt: "2026-06-28T12:12:00+09:00",
    optionGroups: [],
  },
];

export const boothKiosks: BoothKiosks = {
  devices: [
    {
      id: "kiosk-1",
      boothId: booth.id,
      name: "1번 키오스크",
      lastSeenAt: new Date().toISOString(),
      revokedAt: null,
      createdAt: "2026-07-02T08:55:00+09:00",
    },
    {
      id: "kiosk-2",
      boothId: booth.id,
      name: "2번 키오스크",
      lastSeenAt: "2026-07-02T09:00:00+09:00",
      revokedAt: null,
      createdAt: "2026-07-02T08:56:00+09:00",
    },
  ],
  pending: [
    {
      id: "pairing-1",
      boothId: booth.id,
      kioskName: "3번 키오스크",
      expiresAt: "2026-07-10T09:00:00+09:00",
      claimedAt: null,
      createdBy: me.id,
      createdAt: "2026-07-02T08:57:00+09:00",
    },
  ],
};

export const orders: Order[] = [
  {
    id: "order-1",
    boothId: booth.id,
    kioskId: "kiosk-1",
    buyerId: "buyer-1",
    totalAmount: 7000,
    status: "paid",
    paidAt: "2026-07-07T11:03:00+09:00",
    canceledAt: null,
    refundedAt: null,
    createdAt: "2026-07-07T11:02:00+09:00",
  },
  {
    id: "order-2",
    boothId: booth.id,
    kioskId: "kiosk-1",
    buyerId: "buyer-2",
    totalAmount: 3500,
    status: "pending",
    paidAt: null,
    canceledAt: null,
    refundedAt: null,
    createdAt: "2026-07-07T11:05:00+09:00",
  },
];
