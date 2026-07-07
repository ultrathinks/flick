"use client";

import { useState } from "react";
import type { MaskedPayout, PayoutAccount } from "@/entities/payout";
import { fetchPayoutAccount, usePayoutAction } from "@/features/payout-actions";
import { Badge, Button, formatWon } from "@/shared/ui";
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_TONE } from "../model/labels.ts";

export function PayoutCard({ payout }: { payout: MaskedPayout }) {
  const action = usePayoutAction();
  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [revealing, setRevealing] = useState(false);

  async function reveal() {
    setRevealing(true);
    try {
      setAccount(await fetchPayoutAccount(payout.id));
    } finally {
      setRevealing(false);
    }
  }

  const isRequested = payout.status === "requested";

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface px-4 py-3.5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-body font-semibold tabular-nums text-foreground">
              {formatWon(payout.amount)}
            </span>
            <Badge tone={PAYOUT_STATUS_TONE[payout.status]}>
              {PAYOUT_STATUS_LABEL[payout.status]}
            </Badge>
          </div>
          <p className="text-caption text-foreground-subtle">
            {payout.bankName} · {account?.accountNumber ?? payout.accountNumber}{" "}
            · {payout.accountHolder}
          </p>
        </div>
        {isRequested && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                action.mutate({ payoutId: payout.id, action: "reject" })
              }
              disabled={action.isPending}
            >
              거절
            </Button>
            <Button
              size="sm"
              onClick={() =>
                action.mutate({ payoutId: payout.id, action: "pay" })
              }
              disabled={action.isPending}
            >
              지급
            </Button>
          </div>
        )}
      </div>

      {!account && (
        <button
          type="button"
          onClick={reveal}
          disabled={revealing}
          className="self-start text-caption text-brand transition-colors hover:text-brand-hover disabled:opacity-50"
        >
          {revealing ? "불러오는 중…" : "전체 계좌번호 보기 (조회 기록 남음)"}
        </button>
      )}
    </div>
  );
}
