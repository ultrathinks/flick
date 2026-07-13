export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "booth.approve": "부스 승인",
  "booth.reject": "부스 거절",
  "charge.create": "충전",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action;
}
