import { API_BASE_URL } from "@/shared/config";
import type { SessionTokens } from "./cookies.ts";

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
