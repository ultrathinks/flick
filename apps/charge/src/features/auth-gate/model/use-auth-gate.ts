import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  exchangeDodamToken,
  readTokens,
  subscribeSessionCleared,
  writeTokens,
} from "@/entities/session";
import { fetchMe, meQueryKey } from "@/entities/user";
import { readDodamToken } from "@/shared/lib";

type Status =
  | "checking"
  | "authenticated"
  | "unauthorized"
  | "unauthenticated"
  | "error";

export function useAuthGate() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("checking");
  const statusRef = useRef(status);
  statusRef.current = status;
  const resolving = useRef(false);

  const resolve = useCallback(async () => {
    if (resolving.current) {
      return;
    }
    resolving.current = true;
    setStatus("checking");
    try {
      if (!readTokens()) {
        const dodamToken = readDodamToken();
        if (!dodamToken) {
          setStatus("unauthenticated");
          return;
        }
        const session = await exchangeDodamToken(dodamToken).catch(() => null);
        if (!session) {
          setStatus("error");
          return;
        }
        writeTokens(session);
      }

      const me = await fetchMe().catch(() => null);
      if (me) {
        queryClient.setQueryData(meQueryKey, me);
        setStatus(me.isAdmin ? "authenticated" : "unauthorized");
        return;
      }
      setStatus(readDodamToken() ? "error" : "unauthenticated");
    } finally {
      resolving.current = false;
    }
  }, [queryClient]);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  useEffect(() => {
    return subscribeSessionCleared(() => {
      if (statusRef.current === "authenticated") {
        setStatus("unauthenticated");
      }
    });
  }, []);

  const retry = useCallback(() => {
    void resolve();
  }, [resolve]);

  return { status, retry };
}
