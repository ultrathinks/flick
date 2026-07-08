import { useRouter } from "@b1nd/aid-kit/navigation";
import { TransactionRow, useMyTransactions } from "@/entities/transaction";
import { useMe } from "@/entities/user";
import { Button, Card, QueryState, Screen, Skeleton } from "@/shared/ui";
import { BalanceCard } from "@/widgets/balance-card";

export const HomePage = () => {
  const { stack } = useRouter();
  const me = useMe();
  const transactions = useMyTransactions();
  const list = transactions.data ?? [];

  return (
    <Screen className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-md space-y-6 px-5 pb-10 pt-6">
        {me.isPending ? (
          <div className="space-y-4">
            <Skeleton className="aspect-[1.586/1] w-full rounded-card" />
            <Skeleton className="h-[72px] rounded-card" />
          </div>
        ) : me.isError || !me.data ? (
          <Card className="flex items-center justify-between gap-3">
            <span className="text-body text-foreground-subtle">
              잔액을 불러오지 못했어요.
            </span>
            <Button variant="ghost" size="sm" onClick={() => me.refetch()}>
              다시 시도
            </Button>
          </Card>
        ) : (
          <BalanceCard balance={me.data.balance} />
        )}

        <section>
          <h2 className="mb-2 px-1 text-heading font-bold text-foreground">
            최근 거래
          </h2>
          <QueryState
            isPending={transactions.isPending}
            isError={transactions.isError}
            isEmpty={list.length === 0}
            onRetry={() => transactions.refetch()}
            loading={
              <div className="space-y-2 rounded-card border border-border bg-surface p-4">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            }
            empty={
              <Card>
                <EmptyRecent />
              </Card>
            }
          >
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
          </QueryState>
        </section>
      </div>
    </Screen>
  );
};

function EmptyRecent() {
  return (
    <div className="py-6 text-center">
      <p className="text-body font-medium text-foreground">
        아직 거래 내역이 없어요
      </p>
      <p className="mt-1 text-caption text-foreground-subtle">
        충전하거나 결제하면 여기에 표시돼요.
      </p>
    </div>
  );
}
