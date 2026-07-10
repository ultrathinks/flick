import { useEffect, useRef } from "react";
import { getApiBaseUrl } from "./client";

export type KioskEvent =
  | { type: "product.updated"; productId: string }
  | { type: "payment.completed"; paymentId: string }
  | { type: "payment.canceled"; paymentId: string }
  | { type: "payment.expired"; paymentId: string }
  | { type: "kiosk.presence"; kioskId: string; online: boolean }
  | { type: "kiosk.revoked"; kioskId: string };

const HEARTBEAT_MS = 15_000;
const RECONNECT_MS = 3_000;

type Options = {
  onProductUpdated?: () => void;
  onRevoked?: () => void;
};

export function useKioskRealtime(
  token: string | null,
  { onProductUpdated, onRevoked }: Options,
): void {
  const onProductUpdatedRef = useRef(onProductUpdated);
  const onRevokedRef = useRef(onRevoked);
  onProductUpdatedRef.current = onProductUpdated;
  onRevokedRef.current = onRevoked;

  useEffect(() => {
    if (!token) {
      return;
    }
    const base = getApiBaseUrl();
    let stopped = false;

    const sendHeartbeat = () => {
      if (stopped) {
        return;
      }
      fetch(`${base}/kiosks/me/heartbeat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true,
      }).catch(() => {});
    };
    sendHeartbeat();
    const heartbeat = window.setInterval(sendHeartbeat, HEARTBEAT_MS);

    const abort = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const handle = (event: KioskEvent) => {
      if (event.type === "product.updated") {
        onProductUpdatedRef.current?.();
      } else if (event.type === "kiosk.revoked") {
        stopped = true;
        onRevokedRef.current?.();
      }
    };

    async function connect() {
      if (stopped || abort.signal.aborted) {
        return;
      }
      try {
        const response = await fetch(`${base}/kiosks/me/events`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abort.signal,
        });
        if (response.status === 401) {
          stopped = true;
          onRevokedRef.current?.();
          return;
        }
        if (!response.ok || !response.body) {
          scheduleReconnect();
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            const dataLine = frame
              .split("\n")
              .find((line) => line.startsWith("data: "));
            if (!dataLine) {
              continue;
            }
            try {
              handle(JSON.parse(dataLine.slice(6)) as KioskEvent);
            } catch {}
          }
        }
        scheduleReconnect();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        scheduleReconnect();
      }
    }

    function scheduleReconnect() {
      if (stopped || abort.signal.aborted) {
        return;
      }
      reconnectTimer = setTimeout(connect, RECONNECT_MS);
    }

    connect();

    return () => {
      window.clearInterval(heartbeat);
      abort.abort();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [token]);
}
