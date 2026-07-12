import type { OrderStatus } from "./status.ts";

export interface EventEnvelope<T extends string, D> {
  v: 1;
  id: string;
  ts: string;
  type: T;
  data: D;
}

export type BoothEvent =
  | EventEnvelope<
      "order.created",
      {
        orderId: string;
        kioskId: string | null;
        items: Array<{ name: string; quantity: number }>;
      }
    >
  | EventEnvelope<
      "order.updated",
      { orderId: string; kioskId: string | null; status: OrderStatus }
    >
  | EventEnvelope<
      "payment.completed" | "payment.canceled" | "payment.expired",
      {
        paymentId: string;
        orderId: string;
        kioskId: string | null;
        reason?: string;
      }
    >
  | EventEnvelope<"product.updated", { productId: string }>
  | EventEnvelope<"kiosk.presence", { kioskId: string; online: boolean }>
  | EventEnvelope<"kiosk.paired", { kioskId: string; pairingId: string }>
  | EventEnvelope<"kiosk.revoked", { kioskId: string }>
  | EventEnvelope<"booth.approved" | "booth.rejected", { boothId: string }>;

export type UserEvent =
  | EventEnvelope<"balance.changed", { balance: number }>
  | EventEnvelope<"transaction.created", { transactionId: string }>;

export type AdminEvent =
  | EventEnvelope<"stats.changed", Record<string, never>>
  | EventEnvelope<
      "order.updated",
      { orderId: string; boothId: string; status: OrderStatus }
    >
  | EventEnvelope<
      "booth.created" | "booth.approved" | "booth.rejected",
      { boothId: string }
    >
  | EventEnvelope<"payout.changed", { userId: string }>;

export type ChannelEvent = BoothEvent | UserEvent | AdminEvent;
