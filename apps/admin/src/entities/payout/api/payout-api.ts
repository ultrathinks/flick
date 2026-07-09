import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { request } from "@/shared/api";
import { type AdminPayout, adminPayoutSchema } from "../model/types.ts";

const payoutListSchema = z.array(adminPayoutSchema);

export function usePayouts() {
  return useQuery<AdminPayout[]>({
    queryKey: ["payouts"],
    queryFn: () => request(payoutListSchema, "payouts"),
  });
}
