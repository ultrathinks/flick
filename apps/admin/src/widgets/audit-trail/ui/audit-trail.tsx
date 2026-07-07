"use client";

import { useMemo, useState } from "react";
import { type AuditLog, auditAmount, useAuditLogs } from "@/entities/audit";
import { formatWon, Select } from "@/shared/ui";
import { type Column, DataTable } from "@/widgets/data-table";
import { AUDIT_ACTION_LABEL, auditActionLabel } from "../model/labels.ts";

function formatDateTime(date: Date): string {
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const columns: Column<AuditLog>[] = [
  {
    key: "createdAt",
    header: "시각",
    cell: (log) => formatDateTime(log.createdAt),
  },
  { key: "actorName", header: "관리자", cell: (log) => log.actorName },
  {
    key: "action",
    header: "액션",
    cell: (log) => auditActionLabel(log.action),
  },
  {
    key: "target",
    header: "대상",
    cell: (log) => log.targetType,
  },
  {
    key: "amount",
    header: "금액",
    align: "right",
    cell: (log) => {
      const amount = auditAmount(log.metadata);
      return amount === null ? "—" : formatWon(amount);
    },
  },
];

export function AuditTrail() {
  const [action, setAction] = useState("");
  const logs = useAuditLogs({ action: action || undefined });

  const rows = useMemo(
    () => logs.data?.pages.flatMap((page) => page.items) ?? [],
    [logs.data],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(log) => log.id}
      isLoading={logs.isPending}
      isError={logs.isError}
      emptyTitle="감사 로그가 없어요"
      hasMore={logs.hasNextPage}
      isFetchingMore={logs.isFetchingNextPage}
      onLoadMore={() => logs.fetchNextPage()}
      toolbar={
        <Select
          value={action}
          onChange={(event) => setAction(event.target.value)}
          className="max-w-48"
        >
          <option value="">전체 액션</option>
          {Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      }
    />
  );
}
