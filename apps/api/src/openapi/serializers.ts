import type {
  Booth,
  Kiosk,
  KioskPairing,
  Payment,
  Transaction,
} from "../db/schema/index.ts";

export const KIOSK_PUBLIC_OMIT = { tokenHash: true } as const;
export const KIOSK_PAIRING_PUBLIC_OMIT = { codeHash: true } as const;
export const PAYMENT_PUBLIC_OMIT = { codeHash: true } as const;
export const BOOTH_PUBLIC_OMIT = { approvedBy: true } as const;
export const TRANSACTION_PUBLIC_OMIT = {
  idempotencyKey: true,
  adminId: true,
} as const;

declare const publicBrand: unique symbol;
type Public<T> = T & { readonly [publicBrand]: true };

export type PublicKiosk = Public<Omit<Kiosk, keyof typeof KIOSK_PUBLIC_OMIT>>;
export type PublicKioskPairing = Public<
  Omit<KioskPairing, keyof typeof KIOSK_PAIRING_PUBLIC_OMIT>
>;
export type PublicPayment = Public<
  Omit<Payment, keyof typeof PAYMENT_PUBLIC_OMIT>
>;
export type PublicBooth = Public<Omit<Booth, keyof typeof BOOTH_PUBLIC_OMIT>>;
export type PublicTransaction = Public<
  Omit<Transaction, keyof typeof TRANSACTION_PUBLIC_OMIT>
>;

export function serializeKiosk(row: Kiosk): PublicKiosk {
  const { tokenHash, ...rest } = row;
  return rest as PublicKiosk;
}

export function serializeKioskPairing(row: KioskPairing): PublicKioskPairing {
  const { codeHash, ...rest } = row;
  return rest as PublicKioskPairing;
}

export function serializePayment(row: Payment): PublicPayment {
  const { codeHash, ...rest } = row;
  return rest as PublicPayment;
}

export function serializeBooth(row: Booth): PublicBooth {
  const { approvedBy, ...rest } = row;
  return rest as PublicBooth;
}

export function serializeTransaction(row: Transaction): PublicTransaction {
  const { idempotencyKey, adminId, ...rest } = row;
  return rest as PublicTransaction;
}
