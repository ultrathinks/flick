"use client";

import { openSse } from "@flick/api-client";
import type { BoothEvent } from "@flick/contract";
import { useEffect, useRef } from "react";

export type { BoothEvent } from "@flick/contract";

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
    const handle = openSse({
      url: `/api/proxy/booths/${boothId}/events`,
      onOpen: () => onReconnectRef.current?.(),
      onEvent: (e) => onEventRef.current(e.data as BoothEvent),
    });
    return () => handle.close();
  }, [boothId]);
}
