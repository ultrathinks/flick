export const ERROR_CODES = [
  "VALIDATION",
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PAYMENT_EXPIRED",
  "PAYMENT_NOT_PENDING",
  "INSUFFICIENT_BALANCE",
  "OUT_OF_STOCK",
  "KIOSK_REVOKED",
  "REQUEST_ERROR",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: string): value is ErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}
