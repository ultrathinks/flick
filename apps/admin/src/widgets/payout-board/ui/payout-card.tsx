"use client";

import { useState } from "react";
import type { MaskedPayout, PayoutAccount } from "@/entities/payout";
import { fetchPayoutAccount, usePayoutAction } from "@/features/payout-actions";
import {
  Badge,
  Button,
  Card,
  CopyButton,
  formatWon,
  useConfirm,
  useToast,
} from "@/shared/ui";
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_TONE } from "../model/labels.ts";

export function PayoutCard({ payout }: { payout: MaskedPayout }) {
  const action = usePayoutAction();
  const confirm = useConfirm();
  const toast = useToast();
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

  async function pay() {
    const ok = await confirm({
      title: "환급을 지급할까요?",
      description: `${payout.accountHolder} 님에게 ${formatWon(payout.availableAmount)}을 지급해요. 지급 후에는 되돌릴 수 없어요.`,
      confirmLabel: "지급",
      tone: "brand",
    });
    if (!ok) {
      return;
    }
    action.mutate(
      { payoutId: payout.id, action: "pay" },
      { onSuccess: () => toast.success("환급을 지급했어요") },
    );
  }

  async function reject() {
    const ok = await confirm({
      title: "환급 요청을 거절할까요?",
      description: `${payout.accountHolder} 님의 ${formatWon(payout.availableAmount)} 환급 요청을 거절해요.`,
      confirmLabel: "거절",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    action.mutate(
      { payoutId: payout.id, action: "reject" },
      { onSuccess: () => toast.success("환급 요청을 거절했어요") },
    );
  }

  const isRequested = payout.status === "requested";
  const isRejected = payout.status === "rejected";
  const displayAmount = payout.amount ?? payout.availableAmount;

  return (
    <Card className="flex flex-col gap-3 px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-body font-semibold tabular-nums text-foreground">
              {isRejected ? "—" : formatWon(displayAmount)}
            </span>
            <Badge tone={PAYOUT_STATUS_TONE[payout.status]}>
              {PAYOUT_STATUS_LABEL[payout.status]}
            </Badge>
          </div>
          <p className="min-w-0 break-words text-caption text-foreground-subtle">
            {payout.bankName} · {payout.accountNumber} · {payout.accountHolder}
          </p>
        </div>
        {isRequested && (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reject}
              disabled={action.isPending}
            >
              거절
            </Button>
            <Button size="sm" onClick={pay} disabled={action.isPending}>
              지급
            </Button>
          </div>
        )}
      </div>

      {account ? (
        <div className="flex items-center gap-2">
          <span className="min-w-0 break-all text-caption tabular-nums text-foreground">
            {account.accountNumber}
          </span>
          <CopyButton value={account.accountNumber} className="shrink-0" />
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={reveal}
          disabled={revealing}
          className="self-start"
        >
          {revealing ? "불러오는 중…" : "전체 계좌번호 보기 (조회 기록 남음)"}
        </Button>
      )}
    </Card>
  );
}
