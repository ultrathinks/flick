export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "booth.approve": "부스 승인",
  "booth.reject": "부스 거절",
  "charge.create": "충전",
  "refund.create": "환불",
  "payout.pay": "환급 지급",
  "payout.reject": "환급 거절",
  "payout.view_plain_account": "계좌 조회",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action;
}
