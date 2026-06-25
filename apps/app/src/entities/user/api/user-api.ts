import { request } from "@/shared/api";
import { type Me, meSchema } from "../model/types.ts";

export function fetchMe(): Promise<Me> {
  return request(meSchema, "users/me");
}
