import type { RouteProps } from "@b1nd/aid-kit/navigation";
import { useRouter } from "@b1nd/aid-kit/navigation";
import { useState } from "react";
import { usePaymentCodeView } from "@/entities/payment";
import {
  type ConfirmFailure,
  classifyConfirmFailure,
  useConfirmPayment,
} from "@/features/pay-by-code";
import { formatSeconds, useCountdown } from "@/shared/lib";
import { Button, Card, Money, Screen, Spinner } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";
import { PaymentComplete } from "./payment-complete.tsx";

const failureMessages: Record<ConfirmFailure, string> = {
  expired: "결제 시간이 만료됐어요. 키오스크에서 코드를 다시 받아 주세요.",
  "insufficient-balance": "잔액이 부족해요. 충전 후 다시 시도해 주세요.",
  "out-of-stock": "재고가 부족해 결제할 수 없어요.",
  canceled: "취소된 주문이에요.",
  unknown: "결제에 실패했어요. 잠시 후 다시 시도해 주세요.",
};

const PaymentBody = ({ code }: { code: string }) => {
  const { stack } = useRouter();
  const view = usePaymentCodeView(code);
  const confirm = useConfirmPayment(code);
  const [done, setDone] = useState(false);

  const expiresAt = view.data ? new Date(view.data.payment.expiresAt) : null;
  const remaining = useCountdown(expiresAt);
  const expired = expiresAt !== null && remaining <= 0;

  if (done) {
    return (
      <PaymentComplete
        amount={view.data?.order.totalAmount ?? 0}
        onDone={() => stack.pop()}
      />
    );
  }

  if (view.isPending) {
    return (
      <Card className="flex justify-center py-12">
        <Spinner />
      </Card>
    );
  }

  if (view.isError || !view.data) {
    return (
      <Card className="space-y-4 py-8 text-center">
        <p className="text-body text-foreground-muted">
          {failureMessages.expired}
        </p>
        <Button block size="lg" onClick={() => stack.pop()}>
          다시 스캔하기
        </Button>
      </Card>
    );
  }

  const { booth, items, order, balance } = view.data;
  const failure = confirm.error ? classifyConfirmFailure(confirm.error) : null;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-heading font-semibold text-foreground">
            {booth.name}
          </p>
          {!expired && (
            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-caption font-medium tabular-nums text-foreground-muted">
              {formatSeconds(remaining)}
            </span>
          )}
        </div>
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
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
        <div className="mt-4 flex justify-between border-t border-border pt-4">
          <span className="text-heading font-semibold text-foreground">
            합계
          </span>
          <Money
            amount={order.totalAmount}
            className="text-title font-bold text-foreground"
          />
        </div>
      </Card>

      <Card className="flex justify-between py-3.5">
        <span className="text-body text-foreground-subtle">결제 후 잔액</span>
        <Money
          amount={balance - order.totalAmount}
          className="text-body font-semibold text-foreground"
        />
      </Card>

      {failure && (
        <p className="px-1 text-body text-danger">{failureMessages[failure]}</p>
      )}

      {expired ? (
        <Button block size="lg" onClick={() => stack.pop()}>
          다시 스캔하기
        </Button>
      ) : (
        <Button
          block
          size="lg"
          onClick={() => {
            confirm.mutate(undefined, { onSuccess: () => setDone(true) });
          }}
          loading={confirm.isPending}
          disabled={confirm.isPending || balance < order.totalAmount}
        >
          {balance < order.totalAmount ? "잔액 부족" : "결제하기"}
        </Button>
      )}
    </div>
  );
};

export const PaymentPage = ({ params }: RouteProps) => {
  const raw = params?.code ?? "";
  const code = raw ? decodeURIComponent(raw) : "";

  return (
    <Screen className="flex-1 overflow-y-auto">
      <PageHeader title="결제 확인" back />
      <div className="px-5 pb-6">
        {code ? (
          <PaymentBody code={code} />
        ) : (
          <Card className="text-center text-body text-foreground-subtle">
            잘못된 결제 코드예요.
          </Card>
        )}
      </div>
    </Screen>
  );
};
