"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import {
  type BoothRanking,
  type MenuSale,
  type Report,
  useReport,
} from "@/entities/report";
import { useAdminEvents } from "@/shared/api/use-admin-events.ts";
import { cn } from "@/shared/lib/cn.ts";
import { formatWon, QueryState, SectionHeader, Stat } from "@/shared/ui";
import { type Column, DataTable } from "@/widgets/data-table";

const boothColumns: Column<BoothRanking & { rank: number }>[] = [
  {
    key: "rank",
    header: "순위",
    cell: (b) => (
      <span className="font-semibold text-foreground-subtle">{b.rank}</span>
    ),
  },
  {
    key: "name",
    header: "부스",
    cell: (b) => <span className="font-medium">{b.name}</span>,
  },
  {
    key: "revenue",
    header: "매출",
    align: "right",
    cell: (b) => <span className="font-semibold">{formatWon(b.revenue)}</span>,
  },
];

const menuColumns: Column<MenuSale>[] = [
  {
    key: "boothName",
    header: "부스",
    cell: (m) => <span className="text-foreground-subtle">{m.boothName}</span>,
  },
  {
    key: "menuName",
    header: "메뉴",
    cell: (m) => <span className="font-medium">{m.menuName}</span>,
  },
  {
    key: "quantity",
    header: "수량",
    align: "right",
    cell: (m) => <span className="tabular-nums">{m.quantity}</span>,
  },
  {
    key: "revenue",
    header: "매출",
    align: "right",
    cell: (m) => <span className="font-semibold">{formatWon(m.revenue)}</span>,
  },
];

const DOWNLOADS = [
  { href: "/report/export/analytics", label: "행사 리포트" },
  { href: "/report/export/accounts", label: "환급 계좌" },
  { href: "/report/export/ledger", label: "거래 원장" },
];

function DownloadButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      {DOWNLOADS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          download
          className="inline-flex h-9 items-center gap-1.5 rounded-control bg-brand-subtle px-3.5 text-body font-semibold text-brand transition-colors hover:brightness-95"
        >
          <Download className="size-4" />
          {item.label}
        </a>
      ))}
    </div>
  );
}

function Summary({ summary }: { summary: Report["summary"] }) {
  const balanced = summary.reconciliation === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat
          label="실충전"
          value={formatWon(summary.totalCharged)}
          hint="실제 현금 유입"
        />
        <Stat
          label="기부 재원"
          value={formatWon(summary.totalRevenue)}
          hint="구매 총액"
        />
        <Stat
          label="순기부액"
          value={formatWon(summary.netDonation)}
          hint="환불 반영 후"
        />
        <Stat
          label="주문 수"
          value={`${summary.orderCount.toLocaleString()}건`}
        />
        <Stat
          label="사용자 수"
          value={`${summary.userCount.toLocaleString()}명`}
        />
        <Stat
          label="환급 대상액"
          value={formatWon(summary.refundableTotal)}
          hint="잔액 환급 가능 총액"
        />
        <Stat
          label="미등록 환급액"
          value={formatWon(summary.unregisteredTotal)}
          hint={`계좌 미등록 ${summary.unregisteredCount.toLocaleString()}명`}
        />
        <Stat
          label="검산"
          value={
            <span className={cn(!balanced && "text-danger")}>
              {formatWon(summary.reconciliation)}
            </span>
          }
          hint={balanced ? "장부 일치" : "장부 불일치 — 확인 필요"}
          className={cn(!balanced && "border-danger")}
        />
      </div>
    </div>
  );
}

export function ReportBoard() {
  const report = useReport();
  const queryClient = useQueryClient();

  useAdminEvents({
    onEvent: (event) => {
      if (event.type === "stats.changed") {
        queryClient.invalidateQueries({ queryKey: ["report"] });
      }
    },
    onReconnect: () => {
      queryClient.invalidateQueries({ queryKey: ["report"] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <SectionHeader
          title="다운로드"
          description="정산·환급·분쟁 대비 엑셀 파일"
        />
        <DownloadButtons />
      </div>

      <QueryState
        isPending={report.isPending}
        isError={report.isError}
        onRetry={() => report.refetch()}
      >
        {report.data && (
          <div className="flex flex-col gap-6">
            <Summary summary={report.data.summary} />

            <div className="flex flex-col gap-2">
              <SectionHeader
                title="부스 랭킹"
                description="확정 구매 매출 기준"
              />
              <DataTable
                columns={boothColumns}
                rows={report.data.boothRanking.map((booth, index) => ({
                  ...booth,
                  rank: index + 1,
                }))}
                rowKey={(b) => `${b.rank}-${b.name}`}
                emptyTitle="아직 매출이 없어요"
              />
            </div>

            <div className="flex flex-col gap-2">
              <SectionHeader title="메뉴별 판매" description="상품 기준 집계" />
              <DataTable
                columns={menuColumns}
                rows={report.data.menuSales}
                rowKey={(m) => `${m.boothName}-${m.menuName}`}
                emptyTitle="아직 판매 내역이 없어요"
              />
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}
