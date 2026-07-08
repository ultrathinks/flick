"use client";

import { CreditCard, Receipt, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import type { Booth } from "@/entities/booth";
import { type Order, type OrderStatus, useBoothOrders } from "@/entities/order";
import { useRefund } from "@/features/refund";
import {
  Badge,
  Button,
  EmptyState,
  QueryState,
  SectionHeader,
  Select,
  Skeleton,
  Stat,
  useConfirm,
  useToast,
} from "@/shared/ui";
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

function OrderCard({
  order,
  onRefund,
  refunding,
}: {
  order: Order;
  onRefund: (orderId: string) => void;
  refunding: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-body font-medium tabular-nums text-foreground">
          {order.totalAmount.toLocaleString()}원
        </p>
        <p className="text-caption text-foreground-subtle">
          {formatTime(order.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={STATUS_TONE[order.status]}>
          {STATUS_LABEL[order.status]}
        </Badge>
        {order.status === "paid" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefund(order.id)}
            disabled={refunding}
          >
            환불
          </Button>
        )}
      </div>
    </div>
  );
}

export function OrderBoard({ booth }: { booth: Booth }) {
  const orders = useBoothOrders(booth.id);
  const refund = useRefund(booth.id);
  const confirm = useConfirm();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");

  async function handleRefund(orderId: string) {
    const ok = await confirm({
      title: "이 주문을 환불할까요?",
      description: "결제 금액이 구매자에게 돌아가요.",
      confirmLabel: "환불",
      tone: "danger",
    });
    if (!ok) return;
    refund.mutate(orderId, {
      onSuccess: () => toast.success("환불했어요."),
      onError: () => toast.error("환불에 실패했어요."),
    });
  }

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
    <div className="space-y-6">
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

      <SectionHeader
        title="주문 내역"
        action={
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
        }
      />

      <QueryState
        isPending={orders.isPending}
        isError={orders.isError}
        isEmpty={filtered.length === 0}
        onRetry={() => orders.refetch()}
        loading={
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        }
        empty={
          <EmptyState
            icon={<Receipt />}
            title="주문이 없어요"
            description="키오스크에서 결제가 발생하면 여기에 표시돼요."
          />
        }
      >
        <div className="space-y-2 md:hidden">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onRefund={handleRefund}
              refunding={refund.isPending}
            />
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-card border border-border md:block">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-2.5 text-left text-caption font-medium text-foreground-subtle">
                  주문 시각
                </th>
                <th className="px-4 py-2.5 text-right text-caption font-medium text-foreground-subtle">
                  결제 금액
                </th>
                <th className="px-4 py-2.5 text-right text-caption font-medium text-foreground-subtle">
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
                  <td className="px-4 py-2.5 text-caption text-foreground-subtle">
                    {formatTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-body font-medium tabular-nums text-foreground">
                    {order.totalAmount.toLocaleString()}원
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge tone={STATUS_TONE[order.status]}>
                        {STATUS_LABEL[order.status]}
                      </Badge>
                      {order.status === "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefund(order.id)}
                          disabled={refund.isPending}
                        >
                          환불
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
    </div>
  );
}
