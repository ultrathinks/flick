import { useEffect, useRef } from "react";
import { fetchPayment } from "@/entities/order/api/orders";
import type { SSEStatus } from "@/shared/api/use-payment-sse";
import { usePaymentSSE } from "@/shared/api/use-payment-sse";

export type PaymentOutcome = "completed" | "canceled";

const POLL_INTERVAL_MS = 5000;

function toOutcome(status: string): PaymentOutcome | null {
  if (status === "completed") {
    return "completed";
  }
  if (status === "expired" || status === "canceled") {
    return "canceled";
  }
  return null;
}

function outcomeFromEvent(event: {
  event: string;
  data: Record<string, unknown>;
}): PaymentOutcome | null {
  const type = typeof event.data.type === "string" ? event.data.type : null;
  if (type === "payment.completed") {
    return "completed";
  }
  if (type === "payment.expired" || type === "payment.canceled") {
    return "canceled";
  }
  return toOutcome(event.event);
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
    const outcome = outcomeFromEvent(lastEvent);
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
