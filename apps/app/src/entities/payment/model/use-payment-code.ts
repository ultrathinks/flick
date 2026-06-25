import { useQuery } from "@tanstack/react-query";
import { fetchPaymentCodeView } from "../api/payment-api.ts";

export const paymentCodeQueryKey = (code: string) =>
  ["payment-code", code] as const;

export function usePaymentCodeView(code: string) {
  return useQuery({
    queryKey: paymentCodeQueryKey(code),
    queryFn: () => fetchPaymentCodeView(code),
    retry: false,
    staleTime: 0,
  });
}
