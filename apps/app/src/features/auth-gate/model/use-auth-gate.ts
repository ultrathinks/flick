import {
  Actions,
  useBridgeProvider,
  useBridgeResponse,
} from "@b1nd/aid-kit/bridge-kit/web";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  exchangeDodamToken,
  readTokens,
  writeTokens,
} from "@/entities/session";
import { clearDodamTokenFromUrl, readDodamTokenFromUrl } from "@/shared/lib";

type Status = "checking" | "authenticated" | "unauthenticated" | "error";

function parseOAuthToken(data: unknown): string | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const token = Reflect.get(data, "token");
  return typeof token === "string" && token.length > 0 ? token : null;
}

export function useAuthGate() {
  const [status, setStatus] = useState<Status>(() =>
    readTokens() ? "authenticated" : "checking",
  );
  const { send } = useBridgeProvider();
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

  useBridgeResponse(Actions.OAUTH_GET_TOKEN, async (data) => {
    const token = parseOAuthToken(data);
    if (token) {
      await exchange(token);
    } else {
      setStatus("unauthenticated");
    }
    return {};
  });

  useEffect(() => {
    if (status !== "checking") {
      return;
    }
    const urlToken = readDodamTokenFromUrl();
    if (urlToken) {
      void exchange(urlToken);
      return;
    }
    send(Actions.OAUTH_GET_TOKEN);
  }, [status, exchange, send]);

  const retry = useCallback(() => {
    setStatus("checking");
  }, []);

  return { status, retry };
}
