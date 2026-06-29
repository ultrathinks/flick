import { motion } from "framer-motion";
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
      className="flex min-h-dvh flex-col bg-slate-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white">
            F
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            <span className="text-indigo-600">Flick</span> Place
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-amber-500"
            }`}
          />
          <PaymentTimer remainingSeconds={remainingSeconds} />
        </div>
      </header>
      <section className="flex flex-1 gap-6 p-6">
        <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white">
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
