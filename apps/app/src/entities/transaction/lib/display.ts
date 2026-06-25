import type { TransactionType } from "../model/types.ts";

const labels: Record<TransactionType, string> = {
  grant: "가입 지급",
  charge: "충전",
  purchase: "결제",
  refund: "환불",
  payout: "출금",
  adjustment: "조정",
};

export function transactionLabel(type: TransactionType): string {
  return labels[type];
}

export function isIncome(amount: number): boolean {
  return amount > 0;
}
