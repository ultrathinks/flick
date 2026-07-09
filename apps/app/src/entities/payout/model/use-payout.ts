import { useQuery } from "@tanstack/react-query";
import { fetchPayout } from "../api/payout-api.ts";

export const payoutQueryKey = ["payout"] as const;

export function usePayout() {
  return useQuery({
    queryKey: payoutQueryKey,
    queryFn: fetchPayout,
  });
}
