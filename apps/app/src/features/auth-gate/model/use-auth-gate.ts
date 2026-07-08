import { useCallback, useEffect, useRef, useState } from "react";
import {
  exchangeDodamToken,
  readTokens,
  subscribeSessionCleared,
  writeTokens,
} from "@/entities/session";
import { clearDodamTokenFromUrl, readDodamTokenFromUrl } from "@/shared/lib";

type Status = "checking" | "authenticated" | "unauthenticated" | "error";

export function useAuthGate() {
  const [status, setStatus] = useState<Status>(() =>
    readTokens() ? "authenticated" : "checking",
  );
  const exchanging = useRef(false);

  const exchange = useCallback(async (dodamToken: string) => {
    if (exchanging.current) {
      return;
    }
    exchanging.current = true;
    try {
      const session = await exchangeDodamToken(dodamToken);
      writeTokens(session);
      clearDodamTokenFromUrl();
      setStatus("authenticated");
    } catch {
      setStatus("error");
    } finally {
      exchanging.current = false;
    }
  }, []);

  useEffect(() => {
    return subscribeSessionCleared(() => {
      setStatus("unauthenticated");
    });
  }, []);

  useEffect(() => {
    if (status !== "checking") {
      return;
    }
    const urlToken = readDodamTokenFromUrl();
    if (urlToken) {
      void exchange(urlToken);
      return;
    }
    setStatus(readTokens() ? "authenticated" : "unauthenticated");
  }, [status, exchange]);

  const retry = useCallback(() => {
    setStatus("checking");
  }, []);

  return { status, retry };
}
