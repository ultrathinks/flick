import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savePayout } from "../api/payout-api.ts";
import type { PayoutAccount } from "../model/types.ts";
import { payoutQueryKey } from "../model/use-payout.ts";

export function useSavePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (account: PayoutAccount) => savePayout(account),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payoutQueryKey });
    },
  });
}
