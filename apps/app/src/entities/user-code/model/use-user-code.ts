import { useQuery } from "@tanstack/react-query";
import { fetchUserCode } from "../api/user-code-api.ts";

export const userCodeQueryKey = ["user-code"] as const;

export function useUserCode() {
  return useQuery({
    queryKey: userCodeQueryKey,
    queryFn: fetchUserCode,
  });
}
