import { openSse } from "@flick/api-client";
import type { BoothEvent } from "@flick/contract";
import { useEffect, useRef } from "react";
import { getApiBaseUrl } from "./client.ts";

export type PaymentResolution = {
  paymentId: string;
  outcome: "completed" | "canceled";
  reason?: string;
};

const productsChangedListeners = new Set<() => void>();

export function subscribeProductsChanged(listener: () => void): () => void {
  productsChangedListeners.add(listener);
  return () => {
    productsChangedListeners.delete(listener);
  };
}

export function notifyProductsChanged(): void {
  for (const listener of productsChangedListeners) {
    listener();
  }
}

type Options = {
  onProductUpdated?: () => void;
  onRevoked?: () => void;
  onPaymentResolved?: (resolution: PaymentResolution) => void;
};

export function useKioskRealtime(
  token: string | null,
  { onProductUpdated, onRevoked, onPaymentResolved }: Options,
): void {
  const onProductUpdatedRef = useRef(onProductUpdated);
  const onRevokedRef = useRef(onRevoked);
  const onPaymentResolvedRef = useRef(onPaymentResolved);
  onProductUpdatedRef.current = onProductUpdated;
  onRevokedRef.current = onRevoked;
  onPaymentResolvedRef.current = onPaymentResolved;

  useEffect(() => {
    if (!token) {
      return;
    }

    const handle = openSse({
      url: `${getApiBaseUrl()}/kiosks/me/events`,
      headers: () => (token ? { Authorization: `Bearer ${token}` } : undefined),
      onOpen: () => onProductUpdatedRef.current?.(),
      onRevoked: () => onRevokedRef.current?.(),
      onEvent: (event) => {
        const ev = event.data as BoothEvent;
        if (ev.type === "product.updated") {
          onProductUpdatedRef.current?.();
        } else if (ev.type === "kiosk.revoked") {
          onRevokedRef.current?.();
        } else if (
          ev.type === "payment.completed" ||
          ev.type === "payment.canceled"
        ) {
          onPaymentResolvedRef.current?.({
            paymentId: ev.data.paymentId,
            outcome: ev.type === "payment.completed" ? "completed" : "canceled",
            reason: ev.data.reason,
          });
        }
      },
    });

    return () => handle.close();
  }, [token]);
}
