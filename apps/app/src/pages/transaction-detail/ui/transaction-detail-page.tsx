import type { RouteProps } from "@b1nd/aid-kit/navigation";
import { useOrder } from "@/entities/payment";
import { parseTransaction, transactionLabel } from "@/entities/transaction";
import { formatWon } from "@/shared/lib";
import { Card, Money, Spinner } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

function readTransaction(state: RouteProps["state"]) {
  if (typeof state !== "object" || state === null) {
    return null;
  }
  return parseTransaction(Reflect.get(state, "transaction"));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

const OrderItems = ({ orderId }: { orderId: string }) => {
  const order = useOrder(orderId);

  if (order.isPending) {
    return (
      <Card className="flex justify-center py-8">
        <Spinner />
      </Card>
    );
  }
  if (!order.data) {
    return null;
  }

  return (
    <Card>
      <p className="mb-3 text-sm font-semibold text-zinc-500">주문 내역</p>
      <ul className="space-y-2">
        {order.data.items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span className="text-zinc-600">
              {item.name} × {item.quantity}
            </span>
            <Money amount={item.totalAmount} className="text-zinc-800" />
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const TransactionDetailPage = ({ state }: RouteProps) => {
  const transaction = readTransaction(state);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-zinc-50">
      <PageHeader title="거래 상세" back />
      <div className="space-y-4 px-5 pb-6">
        {transaction ? (
          <>
            <Card className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">구분</span>
                <span className="text-sm font-medium text-zinc-900">
                  {transactionLabel(transaction.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">금액</span>
                <span className="text-sm font-bold text-zinc-900">
                  {formatWon(transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">일시</span>
                <span className="text-sm text-zinc-700">
                  {formatDateTime(transaction.createdAt)}
                </span>
              </div>
            </Card>
            {transaction.orderId && (
              <OrderItems orderId={transaction.orderId} />
            )}
          </>
        ) : (
          <Card className="text-center text-sm text-zinc-500">
            거래 정보를 찾을 수 없어요.
          </Card>
        )}
      </div>
    </div>
  );
};
