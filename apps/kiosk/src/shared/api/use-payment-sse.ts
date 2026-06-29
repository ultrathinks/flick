"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "./client";

export type SSEStatus = "idle" | "connecting" | "connected" | "disconnected";

export type SSEMessage = {
  event: string;
  data: Record<string, unknown>;
};

export function usePaymentSSE(paymentId: string | null, token: string | null) {
  const [status, setStatus] = useState<SSEStatus>("idle");
  const [lastEvent, setLastEvent] = useState<SSEMessage | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!paymentId || !token) {
      return;
    }

    setStatus("connecting");

    const abortController = new AbortController();
    abortRef.current = abortController;

    const url = `${getApiBaseUrl()}/payments/${paymentId}/events`;

    (async () => {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          setStatus("disconnected");
          return;
        }

        setStatus("connected");

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
              currentData = line.slice(6);
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
                } catch {
                  /* ignore malformed JSON */
                }
              }
              currentEvent = "";
              currentData = "";
            }
          }
        }

        setStatus("disconnected");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setStatus("disconnected");
      }
    })();

    return () => {
      abortController.abort();
      abortRef.current = null;
    };
  }, [paymentId, token]);

  return { status, lastEvent };
}
