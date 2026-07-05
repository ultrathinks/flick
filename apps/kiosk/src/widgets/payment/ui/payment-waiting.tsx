import { motion } from "framer-motion";
import { BrandHeader } from "@/shared/ui/brand-header";
import type { OrderSummaryItem } from "./order-summary-panel";
import { OrderSummaryPanel } from "./order-summary-panel";
import { PaymentTimer } from "./payment-timer";
import { QrSection } from "./qr-section";

type PaymentWaitingProps = {
  code: string;
  totalAmount: number;
  items: OrderSummaryItem[];
  remainingSeconds: number;
  isConnected: boolean;
  onCancel: () => void;
};

export function PaymentWaiting({
  code,
  totalAmount,
  items,
  remainingSeconds,
  isConnected,
  onCancel,
}: PaymentWaitingProps) {
  return (
    <motion.main
      className="flex min-h-dvh flex-col bg-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <BrandHeader
        right={
          <div className="flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                isConnected ? "bg-success" : "bg-warning"
              }`}
            />
            <PaymentTimer remainingSeconds={remainingSeconds} />
          </div>
        }
      />
      <section className="flex flex-1 gap-6 p-6">
        <div className="flex flex-1 items-center justify-center rounded-card border border-border bg-surface">
          <QrSection code={code} totalAmount={totalAmount} />
        </div>
        <div className="hidden lg:block">
          <OrderSummaryPanel
            items={items}
            totalAmount={totalAmount}
            onCancel={onCancel}
          />
        </div>
      </section>
    </motion.main>
  );
}
