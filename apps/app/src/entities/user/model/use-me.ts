import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../api/user-api.ts";

export const meQueryKey = ["me"] as const;

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    refetchInterval: 30_000,
  });
}
