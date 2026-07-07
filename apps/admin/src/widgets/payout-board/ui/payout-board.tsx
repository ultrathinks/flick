"use client";

import { useState } from "react";
import { type PayoutStatus, usePayouts } from "@/entities/payout";
import { EmptyState, Loader } from "@/shared/ui";
import { PAYOUT_TABS } from "../model/labels.ts";
import { PayoutCard } from "./payout-card.tsx";

export function PayoutBoard() {
  const [status, setStatus] = useState<PayoutStatus | "">("requested");
  const payouts = usePayouts(status || undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        {PAYOUT_TABS.map((item) => (
          <button
            key={item.value || "all"}
            type="button"
            onClick={() => setStatus(item.value)}
            className={
              status === item.value
                ? "rounded-full bg-brand px-3.5 py-1.5 text-caption font-semibold text-brand-foreground"
                : "rounded-full px-3.5 py-1.5 text-caption font-medium text-foreground-subtle transition-colors hover:bg-surface-muted"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {payouts.isPending ? (
        <div className="flex justify-center py-20">
          <Loader />
        </div>
      ) : (payouts.data?.length ?? 0) === 0 ? (
        <EmptyState title="환급 요청이 없어요" />
      ) : (
        <div className="flex flex-col gap-2">
          {payouts.data?.map((payout) => (
            <PayoutCard key={payout.id} payout={payout} />
          ))}
        </div>
      )}
    </div>
  );
}
