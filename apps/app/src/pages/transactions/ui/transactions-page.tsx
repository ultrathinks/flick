import { useRouter } from "@b1nd/aid-kit/navigation";
import { TransactionRow, useMyTransactions } from "@/entities/transaction";
import { Card, Spinner } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

export const TransactionsPage = () => {
  const { stack } = useRouter();
  const transactions = useMyTransactions();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <PageHeader title="거래 내역" />
      <div className="px-5 pb-6">
        {transactions.isPending ? (
          <Card className="flex justify-center py-12">
            <Spinner />
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.data?.map((tx) => (
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
            {transactions.data && transactions.data.length === 0 && (
              <Card className="text-center text-sm text-zinc-400">
                아직 거래 내역이 없어요.
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
