"use client";

import { openSse } from "@flick/api-client";
import type { AdminEvent } from "@flick/contract";
import { useEffect, useRef } from "react";

export type { AdminEvent } from "@flick/contract";

type Options = {
  onEvent: (event: AdminEvent) => void;
  onReconnect?: () => void;
};

export function useAdminEvents({ onEvent, onReconnect }: Options): void {
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    const handle = openSse({
      url: "/api/proxy/admin/events",
      onOpen: () => onReconnectRef.current?.(),
      onEvent: (e) => onEventRef.current(e.data as AdminEvent),
    });
    return () => handle.close();
  }, []);
}
