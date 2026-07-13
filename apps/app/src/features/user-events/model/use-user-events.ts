import { openSse } from "@flick/api-client";
import type { UserEvent } from "@flick/contract";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { payoutQueryKey } from "@/entities/payout";
import { readAccessToken } from "@/entities/session";
import { transactionsQueryKey } from "@/entities/transaction";
import { meQueryKey } from "@/entities/user";
import { API_BASE_URL } from "@/shared/config";

export function useUserEvents(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!readAccessToken()) {
      return;
    }

    const refetchBalance = () => {
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
      void queryClient.invalidateQueries({ queryKey: payoutQueryKey });
    };
    const refetchHistory = () => {
      void queryClient.invalidateQueries({ queryKey: transactionsQueryKey });
    };

    const handle = openSse({
      url: `${API_BASE_URL}/users/me/events`,
      headers: () => {
        const token = readAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : undefined;
      },
      onOpen: () => {
        refetchBalance();
        refetchHistory();
      },
      onEvent: (event) => {
        const envelope = event.data as UserEvent;
        if (envelope.type === "balance.changed") {
          refetchBalance();
        } else if (envelope.type === "transaction.created") {
          refetchBalance();
          refetchHistory();
        }
      },
    });

    return () => handle.close();
  }, [queryClient]);
}
