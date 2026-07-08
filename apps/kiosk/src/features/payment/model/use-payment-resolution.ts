import { useEffect, useRef } from "react";
import { fetchPayment } from "@/entities/order/api/orders";
import type { SSEStatus } from "@/shared/api/use-payment-sse";
import { usePaymentSSE } from "@/shared/api/use-payment-sse";

export type PaymentOutcome = "completed" | "canceled";

const POLL_INTERVAL_MS = 5000;

function toOutcome(event: string): PaymentOutcome | null {
  if (event === "completed") {
    return "completed";
  }
  if (event === "expired" || event === "canceled") {
    return "canceled";
  }
  return null;
}

type UsePaymentResolutionOptions = {
  paymentId: string | null;
  token: string | null;
  onResolved: (outcome: PaymentOutcome) => void;
};

export function usePaymentResolution({
  paymentId,
  token,
  onResolved,
}: UsePaymentResolutionOptions): SSEStatus {
  const { status, lastEvent } = usePaymentSSE(paymentId, token);

  const resolvedRef = useRef(false);
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  const resolve = useRef((outcome: PaymentOutcome) => {
    if (resolvedRef.current) {
      return;
    }
    resolvedRef.current = true;
    onResolvedRef.current(outcome);
  }).current;

  useEffect(() => {
    if (!lastEvent) {
      return;
    }
    const outcome = toOutcome(lastEvent.event);
    if (outcome) {
      resolve(outcome);
    }
  }, [lastEvent, resolve]);

  useEffect(() => {
    if (!paymentId || !token) {
      return;
    }

    const poll = async () => {
      if (resolvedRef.current) {
        return;
      }
      try {
        const { payment } = await fetchPayment(token, paymentId);
        if (payment.status !== "pending") {
          const outcome = toOutcome(payment.status);
          if (outcome) {
            resolve(outcome);
          }
        }
      } catch {}
    };

    const id = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paymentId, token, resolve]);

  return status;
}
