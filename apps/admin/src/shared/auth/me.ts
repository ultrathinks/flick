import type { cookies } from "next/headers";
import { z } from "zod";
import { API_INTERNAL_BASE_URL } from "@/shared/config";
import { REFRESH_COOKIE } from "./cookies.ts";
import {
  clearSession,
  ensureAccessToken,
  persistSession,
  refreshSession,
} from "./server.ts";

export const meSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  profileImageUrl: z.string().nullable(),
  roles: z.array(z.string()),
  isAdmin: z.boolean(),
  studentNumber: z.string().nullable(),
  balance: z.number(),
});

export type Me = z.infer<typeof meSchema>;

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function fetchMe(accessToken: string): Promise<Response> {
  return fetch(`${API_INTERNAL_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

export async function getCurrentUser(
  cookieStore: CookieStore,
): Promise<Me | null> {
  const accessToken = await ensureAccessToken(cookieStore);
  if (!accessToken) {
    return null;
  }

  let response = await fetchMe(accessToken);

  if (response.status === 401) {
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      try {
        const tokens = await refreshSession(refreshToken);
        persistSession(cookieStore, tokens);
        response = await fetchMe(tokens.accessToken);
      } catch {
        clearSession(cookieStore);
        return null;
      }
    }
    if (response.status === 401) {
      clearSession(cookieStore);
      return null;
    }
  }

  if (!response.ok) {
    return null;
  }

  const parsed = meSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : null;
}
