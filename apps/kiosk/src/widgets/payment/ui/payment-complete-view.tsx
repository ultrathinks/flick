import { CircleCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Icon, Money } from "@/shared/ui";

type PaymentCompleteViewProps = {
  totalAmount: number;
  onBackToProducts: () => void;
};

function formatPaymentTime(now: Date) {
  return `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, "0")}. ${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function PaymentCompleteView({
  totalAmount,
  onBackToProducts,
}: PaymentCompleteViewProps) {
  const [countdown, setCountdown] = useState(10);
  const onBackToProductsRef = useRef(onBackToProducts);
  onBackToProductsRef.current = onBackToProducts;

  useEffect(() => {
    if (countdown <= 0) {
      onBackToProductsRef.current();
      return;
    }
    const id = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <Icon
        icon={CircleCheck}
        size={112}
        strokeWidth={1.5}
        className="text-success"
      />
      <h1 className="mt-6 text-display font-bold text-foreground">결제 완료</h1>
      <p className="mt-3 text-subtitle font-medium text-foreground-subtle">
        주문이 성공적으로 완료되었어요
      </p>
      <div className="mt-10 grid w-full max-w-sm grid-cols-2 gap-4">
        <div className="rounded-card border border-border bg-surface-muted p-5">
          <p className="text-caption font-bold text-foreground-subtle">
            결제 금액
          </p>
          <Money
            amount={totalAmount}
            className="mt-2 block text-title font-black text-brand"
          />
        </div>
        <div className="rounded-card border border-border bg-surface-muted p-5">
          <p className="text-caption font-bold text-foreground-subtle">
            결제 시간
          </p>
          <p className="mt-2 text-heading font-bold text-foreground">
            {formatPaymentTime(new Date())}
          </p>
        </div>
      </div>
      <p className="mt-10 text-body font-medium text-foreground-faint">
        {countdown}초 후 자동으로 화면이 전환됩니다
      </p>
      <Button
        size="xl"
        block
        variant="neutral"
        className="mt-4 max-w-sm"
        onClick={onBackToProducts}
      >
        메뉴로 돌아가기
      </Button>
    </main>
  );
}
