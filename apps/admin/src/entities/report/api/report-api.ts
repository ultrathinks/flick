import { useQuery } from "@tanstack/react-query";
import { request } from "@/shared/api";
import { type Report, reportSchema } from "../model/types.ts";

export function useReport() {
  return useQuery<Report>({
    queryKey: ["report"],
    queryFn: () => request(reportSchema, "report"),
    refetchInterval: 30_000,
  });
}
