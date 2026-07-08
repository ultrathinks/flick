import { cookies } from "next/headers";
import { cache } from "react";
import { API_INTERNAL_BASE_URL } from "@/shared/config";
import { readAccessToken, readRefreshToken } from "./server.ts";

export type SessionState = "authenticated" | "expired" | "unauthenticated";

async function isAccessTokenValid(accessToken: string): Promise<boolean> {
  const response = await fetch(`${API_INTERNAL_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return response.ok;
}

export const getSessionState = cache(async (): Promise<SessionState> => {
  const cookieStore = await cookies();
  const accessToken = readAccessToken(cookieStore);
  const hasRefreshToken = readRefreshToken(cookieStore) !== null;

  if (accessToken && (await isAccessTokenValid(accessToken))) {
    return "authenticated";
  }

  return hasRefreshToken ? "expired" : "unauthenticated";
});
