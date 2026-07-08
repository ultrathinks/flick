import type { RouteProps } from "@b1nd/aid-kit/navigation";
import { useOrder } from "@/entities/payment";
import {
  isIncome,
  parseTransaction,
  transactionLabel,
} from "@/entities/transaction";
import { Card, EmptyState, Money, Screen, Spinner } from "@/shared/ui";
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
      <Card className="flex justify-center py-12">
        <Spinner />
      </Card>
    );
  }
  if (order.isError || !order.data) {
    return (
      <Card>
        <p className="py-2 text-center text-body text-foreground-subtle">
          주문 내역을 불러오지 못했어요.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-3 text-body font-semibold text-foreground-subtle">
        주문 내역
      </p>
      <ul className="space-y-2">
        {order.data.items.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-3 text-body"
          >
            <span className="truncate text-foreground-muted">
              {item.name} × {item.quantity}
            </span>
            <Money
              amount={item.totalAmount}
              className="shrink-0 text-foreground"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const TransactionDetailPage = ({ state }: RouteProps) => {
  const transaction = readTransaction(state);

  return (
    <Screen className="flex-1 overflow-y-auto">
      <PageHeader title="거래 상세" back />
      <div className="space-y-6 px-5 pb-6 pt-2">
        {transaction ? (
          <>
            <Card className="space-y-3">
              <div className="flex justify-between">
                <span className="text-body text-foreground-subtle">구분</span>
                <span className="text-body font-medium text-foreground">
                  {transactionLabel(transaction.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body text-foreground-subtle">금액</span>
                <Money
                  amount={transaction.amount}
                  signed
                  className={`text-body font-bold ${
                    isIncome(transaction.amount)
                      ? "text-brand"
                      : "text-foreground"
                  }`}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-body text-foreground-subtle">일시</span>
                <span className="text-body text-foreground-muted">
                  {formatDateTime(transaction.createdAt)}
                </span>
              </div>
            </Card>
            {transaction.orderId && (
              <OrderItems orderId={transaction.orderId} />
            )}
          </>
        ) : (
          <Card>
            <EmptyState
              emoji="🔍"
              title="거래 정보를 찾을 수 없어요"
              description="목록에서 다시 선택해 주세요."
            />
          </Card>
        )}
      </div>
    </Screen>
  );
};
