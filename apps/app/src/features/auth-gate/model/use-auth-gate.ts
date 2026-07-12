import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  exchangeDodamToken,
  readTokens,
  subscribeSessionCleared,
  writeTokens,
} from "@/entities/session";
import { fetchMe, meQueryKey } from "@/entities/user";
import { forgetDodamToken, takeDodamTokenFromUrl } from "@/shared/lib";

type Status = "checking" | "authenticated" | "unauthenticated" | "error";

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
      const dodamToken = takeDodamTokenFromUrl();

      if (readTokens()) {
        const me = await fetchMe().catch(() => null);
        if (me) {
          queryClient.setQueryData(meQueryKey, me);
          setStatus("authenticated");
          return;
        }
      }

      if (dodamToken) {
        const session = await exchangeDodamToken(dodamToken).catch(() => null);
        if (session) {
          writeTokens(session);
          forgetDodamToken();
          setStatus("authenticated");
        } else {
          setStatus("error");
        }
        return;
      }

      setStatus(readTokens() ? "error" : "unauthenticated");
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
