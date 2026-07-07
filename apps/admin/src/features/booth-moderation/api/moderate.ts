import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Booth, boothSchema } from "@/entities/booth";
import { request } from "@/shared/api";

async function moderate(
  boothId: string,
  action: "approve" | "reject",
): Promise<Booth> {
  return request(boothSchema, `booths/${boothId}/${action}`, {
    method: "post",
  });
}

export function useBoothModeration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { boothId: string; action: "approve" | "reject" }) =>
      moderate(params.boothId, params.action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booths"] });
    },
  });
}
