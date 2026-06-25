import { Money } from "@/shared/ui";
import { isIncome, transactionLabel } from "../lib/display.ts";
import type { Transaction } from "../model/types.ts";

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const TransactionRow = ({
  transaction,
  onClick,
}: TransactionRowProps) => {
  const income = isIncome(transaction.amount);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-zinc-100 bg-white px-5 py-3.5 text-left active:bg-zinc-50"
    >
      <span>
        <span className="block text-sm font-medium text-zinc-800">
          {transactionLabel(transaction.type)}
        </span>
        <span className="block text-xs text-zinc-400">
          {formatDate(transaction.createdAt)}
        </span>
      </span>
      <Money
        amount={transaction.amount}
        className={`text-sm font-semibold ${
          income ? "text-blue-600" : "text-zinc-900"
        }`}
      />
    </button>
  );
};
