"use client";

import { useState } from "react";
import { type PayoutStatus, usePayouts } from "@/entities/payout";
import { Button, EmptyState, Loader, QueryState } from "@/shared/ui";
import { PAYOUT_TABS } from "../model/labels.ts";
import { PayoutCard } from "./payout-card.tsx";

export function PayoutBoard() {
  const [status, setStatus] = useState<PayoutStatus | "">("requested");
  const payouts = usePayouts(status || undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        {PAYOUT_TABS.map((item) => (
          <Button
            key={item.value || "all"}
            size="sm"
            variant={status === item.value ? "fill" : "neutral"}
            onClick={() => setStatus(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <QueryState
        isPending={payouts.isPending}
        isError={payouts.isError}
        isEmpty={(payouts.data?.length ?? 0) === 0}
        onRetry={() => payouts.refetch()}
        loading={
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        }
        empty={<EmptyState title="환급 요청이 없어요" />}
      >
        <div className="flex flex-col gap-2">
          {payouts.data?.map((payout) => (
            <PayoutCard key={payout.id} payout={payout} />
          ))}
        </div>
      </QueryState>
    </div>
  );
}
