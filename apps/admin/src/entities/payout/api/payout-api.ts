import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { request } from "@/shared/api";
import {
  type MaskedPayout,
  maskedPayoutSchema,
  type PayoutStatus,
} from "../model/types.ts";

const payoutListSchema = z.array(maskedPayoutSchema);

export function usePayouts(status?: PayoutStatus) {
  return useQuery<MaskedPayout[]>({
    queryKey: ["payouts", status ?? "all"],
    queryFn: () =>
      request(
        payoutListSchema,
        status ? `payouts?status=${status}` : "payouts",
      ),
  });
}
