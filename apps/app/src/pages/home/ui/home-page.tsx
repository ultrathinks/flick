import { useRouter } from "@b1nd/aid-kit/navigation";
import { TransactionRow, useMyTransactions } from "@/entities/transaction";
import { useMe } from "@/entities/user";
import {
  Button,
  Card,
  QueryState,
  Screen,
  SectionHeader,
  Skeleton,
} from "@/shared/ui";
import { BalanceCard } from "@/widgets/balance-card";
import { PageHeader } from "@/widgets/page-header";

export const HomePage = () => {
  const { stack, tab } = useRouter();
  const me = useMe();
  const transactions = useMyTransactions();
  const recent = transactions.data?.slice(0, 5) ?? [];

  return (
    <Screen className="flex-1 overflow-y-auto">
      <PageHeader title="Flick" />
      <div className="space-y-6 px-5 pb-6 pt-2">
        {me.isPending ? (
          <Skeleton className="h-32 rounded-card" />
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
          <BalanceCard name={me.data.name} balance={me.data.balance} />
        )}

        <div>
          <SectionHeader
            title="최근 거래"
            action={
              recent.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => tab.move("/transactions")}
                >
                  전체 보기
                </Button>
              ) : undefined
            }
          />
          <QueryState
            isPending={transactions.isPending}
            isError={transactions.isError}
            isEmpty={recent.length === 0}
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
              {recent.map((tx) => (
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
        </div>
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
