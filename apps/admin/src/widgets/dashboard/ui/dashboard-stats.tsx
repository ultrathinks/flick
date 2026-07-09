"use client";

import type { Stats, TransactionType } from "@/entities/stats";
import { formatWon, Stat } from "@/shared/ui";

const TYPE_LABEL: Record<TransactionType, string> = {
  grant: "지원금 지급",
  charge: "실충전",
  purchase: "구매",
  refund: "환불",
  adjustment: "조정",
};

function total(stats: Stats, type: TransactionType): number {
  return stats.totals.find((row) => row.type === type)?.amount ?? 0;
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const grant = total(stats, "grant");
  const charge = total(stats, "charge");
  const purchase = Math.abs(total(stats, "purchase"));
  const refund = total(stats, "refund");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Stat
        label={TYPE_LABEL.grant}
        value={formatWon(grant)}
        hint="학교 지원"
      />
      <Stat
        label={TYPE_LABEL.charge}
        value={formatWon(charge)}
        hint="실제 현금"
      />
      <Stat label={TYPE_LABEL.purchase} value={formatWon(purchase)} />
      <Stat label={TYPE_LABEL.refund} value={formatWon(refund)} />
    </div>
  );
}
