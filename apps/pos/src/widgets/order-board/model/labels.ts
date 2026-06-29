import type { OrderStatus } from "@/entities/order";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  canceled: "취소",
  expired: "만료",
  refunded: "환불",
};

export const STATUS_TONE: Record<
  OrderStatus,
  "neutral" | "brand" | "success" | "warning" | "danger"
> = {
  pending: "brand",
  paid: "success",
  canceled: "neutral",
  expired: "danger",
  refunded: "danger",
};
