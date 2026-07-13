import { setAuthHooks } from "@/shared/api";
import { forgetDodamToken, readDodamToken } from "@/shared/lib";
import { exchangeDodamToken, refreshSession } from "../api/session-api.ts";
import {
  clearTokens,
  readAccessToken,
  readRefreshToken,
  writeTokens,
} from "./token-store.ts";

let refreshInFlight: Promise<string | null> | null = null;

async function rotateRefreshToken(): Promise<string | null> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    return null;
  }
  try {
    const session = await refreshSession(refreshToken);
    writeTokens(session);
    return session.accessToken;
  } catch {
    return null;
  }
}

async function reissueFromDodam(): Promise<string | null> {
  const dodamToken = readDodamToken();
  if (!dodamToken) {
    return null;
  }
  try {
    const session = await exchangeDodamToken(dodamToken);
    writeTokens(session);
    return session.accessToken;
  } catch {
    forgetDodamToken();
    return null;
  }
}

async function runRefresh(): Promise<string | null> {
  const rotated = await rotateRefreshToken();
  if (rotated) {
    return rotated;
  }
  const reissued = await reissueFromDodam();
  if (reissued) {
    return reissued;
  }
  clearTokens();
  return null;
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
