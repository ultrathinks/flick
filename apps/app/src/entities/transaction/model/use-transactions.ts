import { useQuery } from "@tanstack/react-query";
import { fetchMyTransactions } from "../api/transaction-api.ts";

export const transactionsQueryKey = ["transactions"] as const;

export function useMyTransactions() {
  return useQuery({
    queryKey: transactionsQueryKey,
    queryFn: fetchMyTransactions,
  });
}
