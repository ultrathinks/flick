import { ListRow, Money } from "@flick/ui";
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
    <ListRow
      title={transactionLabel(transaction.type)}
      description={formatDate(transaction.createdAt)}
      right={
        <Money
          amount={transaction.amount}
          signed
          className={`text-heading font-semibold ${
            income ? "text-brand" : "text-foreground"
          }`}
        />
      }
      withArrow
      onClick={onClick}
    />
  );
};
