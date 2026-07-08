"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "./client";

export type SSEStatus = "idle" | "connecting" | "connected" | "disconnected";

export type SSEMessage = {
  event: string;
  data: Record<string, unknown>;
};

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

function calculateDelay(attempt: number) {
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
}

export function usePaymentSSE(paymentId: string | null, token: string | null) {
  const [status, setStatus] = useState<SSEStatus>("idle");
  const [lastEvent, setLastEvent] = useState<SSEMessage | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!paymentId || !token) {
      return;
    }

    retryCountRef.current = 0;

    const abortController = new AbortController();
    const url = `${getApiBaseUrl()}/payments/${paymentId}/events`;

    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    async function connect() {
      if (!mountedRef.current || abortController.signal.aborted) {
        return;
      }

      setStatus("connecting");

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          scheduleReconnect();
          return;
        }

        if (!mountedRef.current || abortController.signal.aborted) {
          return;
        }

        setStatus("connected");
        retryCountRef.current = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";
        let currentData = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          if (!mountedRef.current || abortController.signal.aborted) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith(":")) {
              continue;
            }
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              currentData = currentData
                ? `${currentData}\n${line.slice(6)}`
                : line.slice(6);
            } else if (line === "") {
              if (currentData) {
                try {
                  const parsed = JSON.parse(currentData) as Record<
                    string,
                    unknown
                  >;
                  setLastEvent({
                    event: currentEvent || "message",
                    data: parsed,
                  });
                } catch {}
              }
              currentEvent = "";
              currentData = "";
            }
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
      if (!mountedRef.current || abortController.signal.aborted) {
        return;
      }

      if (retryCountRef.current >= MAX_RETRIES) {
        setStatus("disconnected");
        return;
      }

      const delay = calculateDelay(retryCountRef.current);
      retryCountRef.current += 1;

      setStatus("connecting");

      reconnectTimeout = setTimeout(connect, delay);
    }

    connect();

    return () => {
      abortController.abort();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [paymentId, token]);

  return { status, lastEvent };
}
