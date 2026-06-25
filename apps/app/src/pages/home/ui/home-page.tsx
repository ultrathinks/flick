import {
  isIncome,
  transactionLabel,
  useMyTransactions,
} from "@/entities/transaction";
import { useMe } from "@/entities/user";
import { Card, Money, Spinner } from "@/shared/ui";
import { BalanceCard } from "@/widgets/balance-card";
import { PageHeader } from "@/widgets/page-header";

export const HomePage = () => {
  const me = useMe();
  const transactions = useMyTransactions();
  const recent = transactions.data?.slice(0, 5) ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <PageHeader title="Flick" />
      <div className="px-5 pb-6">
        {me.isPending ? (
          <Card className="flex justify-center py-10">
            <Spinner />
          </Card>
        ) : me.data ? (
          <BalanceCard name={me.data.name} balance={me.data.balance} />
        ) : (
          <Card className="text-sm text-zinc-500">
            정보를 불러오지 못했어요.
          </Card>
        )}

        <h2 className="mt-8 mb-3 text-sm font-semibold text-zinc-500">
          최근 거래
        </h2>
        <div className="space-y-2">
          {recent.map((tx) => (
            <Card
              key={tx.id}
              className="flex items-center justify-between py-3.5"
            >
              <span className="text-sm font-medium text-zinc-800">
                {transactionLabel(tx.type)}
              </span>
              <Money
                amount={tx.amount}
                className={`text-sm font-semibold ${
                  isIncome(tx.amount) ? "text-blue-600" : "text-zinc-900"
                }`}
              />
            </Card>
          ))}
          {transactions.data && recent.length === 0 && (
            <Card className="text-center text-sm text-zinc-400">
              아직 거래 내역이 없어요.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
