import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type MaskedPayout,
  maskedPayoutSchema,
  type PayoutAccount,
  payoutAccountSchema,
} from "@/entities/payout";
import { request } from "@/shared/api";

export function usePayoutAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      payoutId: string;
      action: "pay" | "reject";
    }): Promise<MaskedPayout> =>
      request(
        maskedPayoutSchema,
        `payouts/${params.payoutId}/${params.action}`,
        {
          method: "post",
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
  });
}

export function fetchPayoutAccount(payoutId: string): Promise<PayoutAccount> {
  return request(payoutAccountSchema, `payouts/${payoutId}/account`);
}
