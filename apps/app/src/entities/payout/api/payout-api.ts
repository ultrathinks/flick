import { request } from "@/shared/api";
import {
  type PayoutAccount,
  type PayoutSummary,
  payoutAccountSchema,
  payoutSummarySchema,
} from "../model/types.ts";

export function fetchPayout(): Promise<PayoutSummary> {
  return request(payoutSummarySchema, "users/me/payout");
}

export function savePayout(account: PayoutAccount): Promise<PayoutAccount> {
  return request(payoutAccountSchema, "users/me/payout", {
    method: "patch",
    json: account,
  });
}
