import { api, request } from "@/shared/api";
import { type Session, sessionSchema } from "../model/types.ts";

export function exchangeDodamToken(token: string): Promise<Session> {
  return request(sessionSchema, "auth/app", {
    method: "post",
    json: { token },
  });
}

export function refreshSession(refreshToken: string): Promise<Session> {
  return request(sessionSchema, "auth/refresh", {
    method: "post",
    json: { refreshToken },
  });
}

export async function logoutSession(): Promise<void> {
  await api.post("auth/logout");
}
