import { useRouter } from "@b1nd/aid-kit/navigation";
import { TransactionRow, useMyTransactions } from "@/entities/transaction";
import { useMe } from "@/entities/user";
import { Card, EmptyState, Screen, SectionHeader, Spinner } from "@/shared/ui";
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
      <div className="px-5 pb-6">
        {me.isPending ? (
          <Card className="flex justify-center py-10">
            <Spinner />
          </Card>
        ) : me.data ? (
          <BalanceCard name={me.data.name} balance={me.data.balance} />
        ) : (
          <Card className="text-body text-foreground-subtle">
            정보를 불러오지 못했어요.
          </Card>
        )}

        <div className="mt-8">
          <SectionHeader
            title="최근 거래"
            action={
              recent.length > 0 ? (
                <button type="button" onClick={() => tab.move("/transactions")}>
                  전체 보기
                </button>
              ) : undefined
            }
          />
          {recent.length > 0 ? (
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
          ) : transactions.data ? (
            <Card flat>
              <EmptyState
                emoji="🧾"
                title="아직 거래 내역이 없어요"
                description="충전하거나 결제하면 여기에 표시돼요."
              />
            </Card>
          ) : null}
        </div>
      </div>
    </Screen>
  );
};
