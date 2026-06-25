import { request } from "@/shared/api";
import { type UserCode, userCodeSchema } from "../model/types.ts";

export function fetchUserCode(): Promise<UserCode> {
  return request(userCodeSchema, "users/me/code");
}

export function rotateUserCode(): Promise<UserCode> {
  return request(userCodeSchema, "users/me/code/rotate", { method: "post" });
}
