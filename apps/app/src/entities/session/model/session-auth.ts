import { setAuthHooks } from "@/shared/api";
import { refreshSession } from "../api/session-api.ts";
import {
  clearTokens,
  readAccessToken,
  readRefreshToken,
  writeTokens,
} from "./token-store.ts";

let refreshInFlight: Promise<string | null> | null = null;

async function runRefresh(): Promise<string | null> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    return null;
  }
  try {
    const session = await refreshSession(refreshToken);
    writeTokens(session);
    return session.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = runRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export function installSessionAuth(): void {
  setAuthHooks({
    getAccessToken: readAccessToken,
    refresh: refreshAccessToken,
  });
}
