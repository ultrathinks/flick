"use client";

import { useStats } from "@/entities/stats";
import { formatWon, Loader, SectionHeader } from "@/shared/ui";
import { DashboardStats } from "./dashboard-stats.tsx";

export function Dashboard() {
  const stats = useStats();

  if (stats.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Loader />
      </div>
    );
  }

  if (stats.isError || !stats.data) {
    return (
      <p className="py-20 text-center text-body text-foreground-subtle">
        통계를 불러오지 못했어요.
      </p>
    );
  }

  const boothSales = [...stats.data.boothSales].sort(
    (a, b) => b.amount - a.amount,
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <SectionHeader title="현황" />
        <DashboardStats stats={stats.data} />
      </div>

      <div>
        <SectionHeader title="부스 매출" />
        <p className="mb-2 px-1 text-caption text-foreground-subtle">
          환불 반영 전 구매 총액 기준
        </p>
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {boothSales.length === 0 ? (
            <p className="px-4 py-10 text-center text-body text-foreground-subtle">
              아직 매출이 없어요.
            </p>
          ) : (
            boothSales.map((booth, index) => (
              <div
                key={booth.boothId}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-caption font-semibold tabular-nums text-foreground-subtle">
                    {index + 1}
                  </span>
                  <span className="text-body text-foreground">
                    {booth.name}
                  </span>
                </div>
                <span className="text-body font-medium tabular-nums text-foreground">
                  {formatWon(Math.abs(booth.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
