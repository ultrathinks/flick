import { cookies } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import { API_INTERNAL_BASE_URL } from "@/shared/config";
import { readAccessToken, readRefreshToken } from "./server.ts";

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

export type SessionState =
  | { status: "authenticated"; user: Me }
  | { status: "expired" }
  | { status: "unauthenticated" };

function fetchMe(accessToken: string): Promise<Response> {
  return fetch(`${API_INTERNAL_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

async function resolveMe(accessToken: string): Promise<Me | null> {
  const response = await fetchMe(accessToken);
  if (!response.ok) {
    return null;
  }
  const parsed = meSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : null;
}

export const getSessionState = cache(async (): Promise<SessionState> => {
  const cookieStore = await cookies();
  const accessToken = readAccessToken(cookieStore);
  const hasRefreshToken = readRefreshToken(cookieStore) !== null;

  if (accessToken) {
    const user = await resolveMe(accessToken);
    if (user) {
      return { status: "authenticated", user };
    }
    return hasRefreshToken
      ? { status: "expired" }
      : { status: "unauthenticated" };
  }

  return hasRefreshToken
    ? { status: "expired" }
    : { status: "unauthenticated" };
});
