import { Actions, useBridgeProvider } from "@b1nd/aid-kit/bridge-kit/web";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmPaymentCode } from "@/entities/payment";
import { transactionsQueryKey } from "@/entities/transaction";
import { meQueryKey } from "@/entities/user";
import { ApiError, isApiError } from "@/shared/api";

export type ConfirmFailure =
  | "expired"
  | "insufficient-balance"
  | "out-of-stock"
  | "canceled"
  | "unknown";

export function classifyConfirmFailure(error: unknown): ConfirmFailure {
  if (!isApiError(error)) {
    return "unknown";
  }
  if (error.status === 404 || error.code === "NOT_FOUND") {
    return "expired";
  }
  const message = error.message.toLowerCase();
  if (message.includes("balance")) {
    return "insufficient-balance";
  }
  if (message.includes("stock")) {
    return "out-of-stock";
  }
  if (message.includes("cancel")) {
    return "canceled";
  }
  return "unknown";
}

export function useConfirmPayment(code: string) {
  const queryClient = useQueryClient();
  const { send } = useBridgeProvider();

  return useMutation({
    mutationFn: () => confirmPaymentCode(code),
    retry: (failureCount, error) =>
      failureCount < 1 && !(error instanceof ApiError),
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
