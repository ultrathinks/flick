import { isApiError } from "@/shared/api";

export type PaymentErrorAction = "rescan" | "charge" | "retry";

export interface PaymentErrorInfo {
  title: string;
  description: string;
  action: PaymentErrorAction;
}

export const EXPIRED_PAYMENT_INFO: PaymentErrorInfo = {
  title: "결제 시간이 만료됐어요",
  description: "키오스크에서 결제 코드를 다시 받아 주세요.",
  action: "rescan",
};

const INSUFFICIENT_BALANCE_INFO: PaymentErrorInfo = {
  title: "잔액이 부족해요",
  description: "충전한 뒤 다시 시도해 주세요.",
  action: "charge",
};

const CATALOG: Record<string, PaymentErrorInfo> = {
  PAYMENT_EXPIRED: EXPIRED_PAYMENT_INFO,
  NOT_FOUND: {
    title: "유효하지 않은 코드예요",
    description: "키오스크에서 결제 코드를 다시 받아 주세요.",
    action: "rescan",
  },
  PAYMENT_NOT_PENDING: {
    title: "결제할 수 없는 주문이에요",
    description: "이미 처리됐거나 취소된 주문이에요.",
    action: "rescan",
  },
  INSUFFICIENT_BALANCE: INSUFFICIENT_BALANCE_INFO,
  OUT_OF_STOCK: {
    title: "재고가 부족해요",
    description: "판매가 마감된 상품이 있어요.",
    action: "rescan",
  },
  TOO_MANY_REQUESTS: {
    title: "잠시 후 다시 시도해 주세요",
    description: "요청이 많아 처리하지 못했어요.",
    action: "retry",
  },
};

const FALLBACK: PaymentErrorInfo = {
  title: "결제에 실패했어요",
  description: "잠시 후 다시 시도해 주세요.",
  action: "retry",
};

export function paymentErrorInfo(error: unknown): PaymentErrorInfo {
  if (isApiError(error)) {
    return CATALOG[error.code] ?? FALLBACK;
  }
  return FALLBACK;
}
