"use client";

import { useEffect, useRef } from "react";

export type BoothEvent =
  | { type: "order.created"; orderId: string; kioskId: string | null }
  | { type: "order.updated"; orderId: string; kioskId: string | null }
  | {
      type: "payment.completed";
      paymentId: string;
      orderId: string;
      kioskId: string | null;
    }
  | {
      type: "payment.canceled";
      paymentId: string;
      orderId: string;
      kioskId: string | null;
    }
  | {
      type: "payment.expired";
      paymentId: string;
      orderId: string;
      kioskId: string | null;
    }
  | { type: "product.updated"; productId: string }
  | { type: "kiosk.presence"; kioskId: string; online: boolean }
  | { type: "kiosk.revoked"; kioskId: string };

type Options = {
  onEvent: (event: BoothEvent) => void;
  onReconnect?: () => void;
};

export function useBoothEvents(
  boothId: string | undefined,
  { onEvent, onReconnect }: Options,
): void {
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    if (!boothId) {
      return;
    }
    const source = new EventSource(`/api/proxy/booths/${boothId}/events`);

    source.onopen = () => {
      onReconnectRef.current?.();
    };

    source.onmessage = (event) => {
      try {
        onEventRef.current(JSON.parse(event.data) as BoothEvent);
      } catch {}
    };

    return () => {
      source.close();
    };
  }, [boothId]);
}
