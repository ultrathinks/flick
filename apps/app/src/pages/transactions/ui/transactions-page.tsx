import { useRouter } from "@b1nd/aid-kit/navigation";
import { TransactionRow, useMyTransactions } from "@/entities/transaction";
import { Card, EmptyState, Screen, Skeleton } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

const skeletonRows = [0, 1, 2, 3, 4];

export const TransactionsPage = () => {
  const { stack } = useRouter();
  const transactions = useMyTransactions();
  const list = transactions.data ?? [];

  return (
    <Screen className="flex-1 overflow-y-auto">
      <PageHeader title="거래 내역" />
      <div className="px-5 pb-6">
        {transactions.isPending ? (
          <div className="divide-y divide-border rounded-card border border-border bg-surface px-4">
            {skeletonRows.map((row) => (
              <div
                key={row}
                className="flex items-center justify-between py-3.5"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : list.length > 0 ? (
          <div className="divide-y divide-border rounded-card border border-border bg-surface px-4">
            {list.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onClick={() =>
                  stack.push(`/transaction/${encodeURIComponent(tx.id)}`, {
                    transaction: tx,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <Card flat>
            <EmptyState
              emoji="🧾"
              title="아직 거래 내역이 없어요"
              description="충전하거나 결제하면 여기에 표시돼요."
            />
          </Card>
        )}
      </div>
    </Screen>
  );
};
