"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useStats } from "@/entities/stats";
import { useAdminEvents } from "@/shared/api/use-admin-events.ts";
import { Card, formatWon, SectionHeader, Skeleton } from "@/shared/ui";

import { DashboardStats } from "./dashboard-stats.tsx";

export function Dashboard() {
  const stats = useStats();
  const queryClient = useQueryClient();

  useAdminEvents({
    onEvent: (event) => {
      if (event.type === "stats.changed") {
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
    },
    onReconnect: () => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  if (stats.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
            <Card key={index} className="flex flex-col gap-2 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-12" />
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <SectionHeader
            title="부스 매출"
            description="환불 반영 전 구매 총액 기준"
          />
          <Card className="flex flex-col gap-4 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                key={index}
                className="flex items-center justify-between gap-3"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  if (stats.isError || !stats.data) {
    return (
      <p className="text-center text-body text-foreground-subtle">
        통계를 불러오지 못했어요.
      </p>
    );
  }

  const boothSales = [...stats.data.boothSales].sort(
    (a, b) => b.amount - a.amount,
  );

  return (
    <div className="flex flex-col gap-6">
      <DashboardStats stats={stats.data} />

      <div className="flex flex-col gap-2">
        <SectionHeader
          title="부스 매출"
          description="환불 반영 전 구매 총액 기준"
        />
        <Card className="p-0 overflow-hidden">
          {boothSales.length === 0 ? (
            <p className="px-4 py-10 text-center text-body text-foreground-subtle">
              아직 매출이 없어요.
            </p>
          ) : (
            boothSales.map((booth, index) => (
              <div
                key={booth.boothId}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 shrink-0 text-caption font-semibold tabular-nums text-foreground-subtle">
                    {index + 1}
                  </span>
                  <span className="truncate text-body text-foreground">
                    {booth.name}
                  </span>
                </div>
                <span className="shrink-0 text-body font-medium tabular-nums text-foreground">
                  {formatWon(Math.abs(booth.amount))}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
