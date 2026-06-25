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
import { Button, Card, Money, Spinner } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

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
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
          ✓
        </div>
        <p className="text-lg font-bold text-zinc-900">결제 완료</p>
        <Button fullWidth={false} onClick={() => stack.pop()}>
          확인
        </Button>
      </Card>
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
        <p className="text-sm text-zinc-600">{failureMessages.expired}</p>
        <Button onClick={() => stack.pop()}>다시 스캔하기</Button>
      </Card>
    );
  }

  const { booth, items, order, balance } = view.data;
  const failure = confirm.error ? classifyConfirmFailure(confirm.error) : null;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-zinc-900">{booth.name}</p>
          {!expired && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium tabular-nums text-zinc-600">
              {formatSeconds(remaining)}
            </span>
          )}
        </div>
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-zinc-600">
                {item.name} × {item.quantity}
              </span>
              <Money amount={item.totalAmount} className="text-zinc-800" />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-zinc-100 pt-4">
          <span className="font-semibold text-zinc-900">합계</span>
          <Money
            amount={order.totalAmount}
            className="text-lg font-bold text-zinc-900"
          />
        </div>
      </Card>

      <Card className="flex justify-between py-3.5">
        <span className="text-sm text-zinc-500">결제 후 잔액</span>
        <Money
          amount={balance - order.totalAmount}
          className="text-sm font-semibold text-zinc-800"
        />
      </Card>

      {failure && (
        <p className="px-1 text-sm text-red-600">{failureMessages[failure]}</p>
      )}

      {expired ? (
        <Button onClick={() => stack.pop()}>다시 스캔하기</Button>
      ) : (
        <Button
          onClick={() => {
            confirm.mutate(undefined, { onSuccess: () => setDone(true) });
          }}
          disabled={confirm.isPending || balance < order.totalAmount}
        >
          {confirm.isPending
            ? "결제 중..."
            : balance < order.totalAmount
              ? "잔액 부족"
              : "결제하기"}
        </Button>
      )}
    </div>
  );
};

export const PaymentPage = ({ params }: RouteProps) => {
  const raw = params?.code ?? "";
  const code = raw ? decodeURIComponent(raw) : "";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-zinc-50">
      <PageHeader title="결제 확인" back />
      <div className="px-5 pb-6">
        {code ? (
          <PaymentBody code={code} />
        ) : (
          <Card className="text-center text-sm text-zinc-500">
            잘못된 결제 코드예요.
          </Card>
        )}
      </div>
    </div>
  );
};
