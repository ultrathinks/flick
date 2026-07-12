import { useQuery } from "@tanstack/react-query";
import { request } from "@/shared/api";
import { type Stats, statsSchema } from "../model/types.ts";

export function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => request(statsSchema, "stats"),
    refetchInterval: 30_000,
  });
}
