import { Actions, useBridgeProvider } from "@b1nd/aid-kit/bridge-kit/web";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearTokens, logoutSession } from "@/entities/session";

export function useLogout() {
  const queryClient = useQueryClient();
  const { send } = useBridgeProvider();

  return useMutation({
    mutationFn: async () => {
      await logoutSession().catch(() => undefined);
    },
    onSettled: () => {
      clearTokens();
      queryClient.clear();
      send(Actions.NAVIGATION_POP);
    },
  });
}
