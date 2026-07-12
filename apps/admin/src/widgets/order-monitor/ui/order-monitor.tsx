"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  type AdminOrder,
  type OrderStatus,
  orderStatuses,
  useOrders,
} from "@/entities/order";
import { useAdminEvents } from "@/shared/api/use-admin-events.ts";
import { Badge, formatWon, Select } from "@/shared/ui";
import { type Column, DataTable } from "@/widgets/data-table";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "../model/labels.ts";

function formatDateTime(date: Date): string {
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const columns: Column<AdminOrder>[] = [
  {
    key: "createdAt",
    header: "시각",
    cell: (o) => formatDateTime(o.createdAt),
  },
  { key: "boothName", header: "부스", cell: (o) => o.boothName },
  { key: "buyerName", header: "구매자", cell: (o) => o.buyerName ?? "—" },
  {
    key: "totalAmount",
    header: "금액",
    align: "right",
    cell: (o) => formatWon(o.totalAmount),
  },
  {
    key: "status",
    header: "상태",
    cell: (o) => (
      <Badge tone={ORDER_STATUS_TONE[o.status]}>
        {ORDER_STATUS_LABEL[o.status]}
      </Badge>
    ),
  },
];

export function OrderMonitor() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const orders = useOrders({ status: status || undefined });
  const queryClient = useQueryClient();

  useAdminEvents({
    onEvent: (event) => {
      if (event.type === "order.updated") {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    },
    onReconnect: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const rows = useMemo(
    () => orders.data?.pages.flatMap((page) => page.items) ?? [],
    [orders.data],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(o) => o.id}
      isLoading={orders.isPending}
      isError={orders.isError}
      emptyTitle="주문이 없어요"
      hasMore={orders.hasNextPage}
      isFetchingMore={orders.isFetchingNextPage}
      onLoadMore={() => orders.fetchNextPage()}
      loadMoreError={orders.isFetchNextPageError}
      toolbar={
        <Select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as OrderStatus | "")
          }
          className="max-w-40"
        >
          <option value="">전체 상태</option>
          {orderStatuses.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABEL[value]}
            </option>
          ))}
        </Select>
      }
    />
  );
}
