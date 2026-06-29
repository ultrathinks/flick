import type { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/config";
import {
  ACCESS_COOKIE,
  COOKIE_OPTIONS,
  REFRESH_COOKIE,
  type SessionTokens,
} from "./cookies.ts";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function exchangeDauthCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<SessionTokens> {
  const response = await fetch(`${API_BASE_URL}/auth/dauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error("dauth exchange failed");
  }
  return (await response.json()) as SessionTokens;
}

export async function refreshSession(
  refreshToken: string,
): Promise<SessionTokens> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    throw new Error("refresh failed");
  }
  return (await response.json()) as SessionTokens;
}

export async function revokeSession(accessToken: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function persistSession(
  cookieStore: CookieStore,
  tokens: SessionTokens,
): void {
  cookieStore.set(ACCESS_COOKIE, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: tokens.expiresIn,
  });
  cookieStore.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

export function clearSession(cookieStore: CookieStore): void {
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function ensureAccessToken(
  cookieStore: CookieStore,
): Promise<string | null> {
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    return accessToken;
  }

  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return null;
  }

  try {
    const tokens = await refreshSession(refreshToken);
    persistSession(cookieStore, tokens);
    return tokens.accessToken;
  } catch {
    clearSession(cookieStore);
    return null;
  }
}
