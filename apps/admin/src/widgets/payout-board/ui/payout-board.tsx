"use client";

import { useMemo, useState } from "react";
import {
  type AdminPayout,
  BankLogo,
  CopyAccount,
  formatAccountNumber,
  resolveBank,
  usePayouts,
} from "@/entities/payout";
import { formatWon, Input, Stat } from "@/shared/ui";
import { type Column, DataTable } from "@/widgets/data-table";

const columns: Column<AdminPayout>[] = [
  {
    key: "accountHolder",
    header: "예금주",
    cell: (p) => <span className="font-medium">{p.accountHolder}</span>,
  },
  {
    key: "bank",
    header: "은행",
    cell: (p) => (
      <span className="flex items-center gap-2">
        <BankLogo bankName={p.bankName} />
        <span className="text-foreground-subtle">
          {resolveBank(p.bankName).name}
        </span>
      </span>
    ),
  },
  {
    key: "accountNumber",
    header: "계좌번호",
    cell: (p) => (
      <CopyAccount
        value={p.accountNumber}
        display={formatAccountNumber(p.bankName, p.accountNumber)}
      />
    ),
  },
  {
    key: "availableAmount",
    header: "환급액",
    align: "right",
    cell: (p) => (
      <span className="font-semibold">{formatWon(p.availableAmount)}</span>
    ),
  },
];

export function PayoutBoard() {
  const [query, setQuery] = useState("");
  const payouts = usePayouts();

  const rows = useMemo(() => {
    const all = [...(payouts.data ?? [])].sort(
      (a, b) => b.availableAmount - a.availableAmount,
    );
    const target = query.trim().toLowerCase();
    if (!target) {
      return all;
    }
    const digits = target.replace(/[^0-9]/g, "");
    return all.filter(
      (p) =>
        p.accountHolder.toLowerCase().includes(target) ||
        resolveBank(p.bankName).name.toLowerCase().includes(target) ||
        p.bankName.toLowerCase().includes(target) ||
        (digits !== "" &&
          p.accountNumber.replace(/[^0-9]/g, "").includes(digits)),
    );
  }, [payouts.data, query]);

  const totalAmount = useMemo(
    () => rows.reduce((sum, p) => sum + p.availableAmount, 0),
    [rows],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Stat label="환급 대상" value={`${rows.length}명`} />
        <Stat label="총 환급액" value={formatWon(totalAmount)} />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        isLoading={payouts.isPending}
        isError={payouts.isError}
        emptyTitle="등록된 환급 계좌가 없어요"
        emptyDescription={query ? "검색 결과가 없어요." : undefined}
        toolbar={
          <Input
            placeholder="예금주 · 은행 · 계좌번호로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="max-w-xs"
          />
        }
      />
    </div>
  );
}
