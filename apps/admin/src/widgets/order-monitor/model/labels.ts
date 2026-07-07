import type { OrderStatus } from "@/entities/order";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "대기",
  paid: "결제됨",
  canceled: "취소",
  expired: "만료",
  refunded: "환불됨",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: "neutral",
  paid: "success",
  canceled: "neutral",
  expired: "warning",
  refunded: "danger",
};
