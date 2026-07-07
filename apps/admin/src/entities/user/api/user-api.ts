import { useCursorQuery } from "@/shared/api";
import { adminUserSchema } from "../model/types.ts";

export function useUsers(query: string) {
  return useCursorQuery({
    queryKey: ["users", query],
    path: "users",
    itemSchema: adminUserSchema,
    searchParams: { q: query || undefined },
  });
}
