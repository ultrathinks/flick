import { Actions, useBridgeProvider } from "@b1nd/aid-kit/bridge-kit/web";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmPaymentCode } from "@/entities/payment";
import { transactionsQueryKey } from "@/entities/transaction";
import { meQueryKey } from "@/entities/user";

export function useConfirmPayment(code: string) {
  const queryClient = useQueryClient();
  const { send } = useBridgeProvider();

  return useMutation({
    mutationFn: () => confirmPaymentCode(code),
    retry: false,
    onSuccess: () => {
      send(Actions.HAPTIC, { style: "success" });
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
      void queryClient.invalidateQueries({ queryKey: transactionsQueryKey });
    },
    onError: () => {
      send(Actions.HAPTIC, { style: "error" });
    },
  });
}
