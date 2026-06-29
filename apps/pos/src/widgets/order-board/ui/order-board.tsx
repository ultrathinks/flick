"use client";

import { CreditCard, Receipt, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import type { Booth } from "@/entities/booth";
import { type Order, type OrderStatus, useBoothOrders } from "@/entities/order";
import { Badge, EmptyState, Select, Skeleton, Stat } from "@/shared/ui";
import { STATUS_LABEL, STATUS_TONE } from "../model/labels.ts";

type Filter = OrderStatus | "all";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium tabular-nums text-foreground">
          {order.totalAmount.toLocaleString()}원
        </p>
        <p className="text-xs text-muted">{formatTime(order.createdAt)}</p>
      </div>
      <Badge tone={STATUS_TONE[order.status]}>
        {STATUS_LABEL[order.status]}
      </Badge>
    </div>
  );
}

export function OrderBoard({ booth }: { booth: Booth }) {
  const orders = useBoothOrders(booth.id);
  const [filter, setFilter] = useState<Filter>("all");

  const summary = useMemo(() => {
    const rows = orders.data ?? [];
    const paid = rows.filter((o) => o.status === "paid");
    const revenue = paid.reduce((sum, o) => sum + o.totalAmount, 0);
    return { total: rows.length, paidCount: paid.length, revenue };
  }, [orders.data]);

  const filtered = useMemo(() => {
    const rows = orders.data ?? [];
    return filter === "all" ? rows : rows.filter((o) => o.status === filter);
  }, [orders.data, filter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          주문 · 매출
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          결제 내역과 매출을 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label="결제 매출"
          value={`${summary.revenue.toLocaleString()}원`}
          icon={<Wallet className="size-4" />}
        />
        <Stat
          label="결제 완료"
          value={`${summary.paidCount}건`}
          icon={<CreditCard className="size-4" />}
        />
        <Stat
          label="전체 주문"
          value={`${summary.total}건`}
          icon={<Receipt className="size-4" />}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">주문 내역</p>
        <div className="w-36">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            <option value="all">전체</option>
            <option value="paid">결제 완료</option>
            <option value="pending">결제 대기</option>
            <option value="canceled">취소</option>
            <option value="refunded">환불</option>
            <option value="expired">만료</option>
          </Select>
        </div>
      </div>

      {orders.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div className="space-y-2 md:hidden">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-border md:block">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted">
                    주문 시각
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted">
                    결제 금액
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-surface-muted/50"
                  >
                    <td className="px-4 py-2.5 text-[13px] text-muted">
                      {formatTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] font-medium tabular-nums text-foreground">
                      {order.totalAmount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge tone={STATUS_TONE[order.status]}>
                        {STATUS_LABEL[order.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Receipt />}
          title="주문이 없어요"
          description="키오스크에서 결제가 발생하면 여기에 표시돼요."
        />
      )}
    </div>
  );
}
