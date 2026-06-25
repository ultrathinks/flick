import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rotateUserCode, userCodeQueryKey } from "@/entities/user-code";

export function useRotateUserCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rotateUserCode,
    onSuccess: (next) => {
      queryClient.setQueryData(userCodeQueryKey, next);
    },
  });
}
