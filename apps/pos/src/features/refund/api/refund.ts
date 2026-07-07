import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { request } from "@/shared/api";

const refundSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amount: z.number(),
  createdAt: z.string(),
});

export function useRefund(boothId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      request(refundSchema, "refunds", {
        method: "post",
        json: { orderId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", boothId] });
    },
  });
}
