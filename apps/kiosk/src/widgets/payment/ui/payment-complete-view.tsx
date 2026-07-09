import { motion } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Icon, Money } from "@/shared/ui";

type PaymentCompleteViewProps = {
  totalAmount: number;
  onBackToProducts: () => void;
};

const AUTO_RETURN_SECONDS = 8;

export function PaymentCompleteView({
  totalAmount,
  onBackToProducts,
}: PaymentCompleteViewProps) {
  const [countdown, setCountdown] = useState(AUTO_RETURN_SECONDS);
  const onBackToProductsRef = useRef(onBackToProducts);
  onBackToProductsRef.current = onBackToProducts;

  useEffect(() => {
    if (countdown <= 0) {
      onBackToProductsRef.current();
      return;
    }
    const id = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <span className="flex size-28 items-center justify-center rounded-full bg-success-subtle">
          <Icon
            icon={CircleCheck}
            size={72}
            strokeWidth={2}
            className="text-success"
          />
        </span>
      </motion.div>

      <h1 className="mt-8 text-display font-bold text-foreground">결제 완료</h1>
      <p className="mt-3 text-subtitle font-medium text-foreground-subtle">
        주문이 정상적으로 접수되었어요
      </p>

      <div className="mt-8 flex flex-col items-center gap-1">
        <p className="text-caption font-bold text-foreground-subtle">
          결제 금액
        </p>
        <Money
          amount={totalAmount}
          className="text-display font-black text-brand"
        />
      </div>

      <Button
        size="xl"
        block
        className="mt-10 max-w-sm"
        onClick={onBackToProducts}
      >
        메뉴로 돌아가기
      </Button>
      <p className="mt-4 text-body font-medium text-foreground-faint">
        {countdown}초 후 자동으로 처음 화면으로 돌아가요
      </p>
    </main>
  );
}
