import { motion } from "framer-motion";
import type { SSEStatus } from "@/shared/api/use-payment-sse";
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
  connectionStatus: SSEStatus;
  onCancel: () => void;
};

export function PaymentWaiting({
  code,
  totalAmount,
  items,
  remainingSeconds,
  connectionStatus,
  onCancel,
}: PaymentWaitingProps) {
  const connectionLabel =
    connectionStatus === "disconnected"
      ? "연결이 끊겼어요"
      : connectionStatus === "connecting"
        ? "연결 재시도 중…"
        : null;

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
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-success"
                    : connectionStatus === "disconnected"
                      ? "bg-danger"
                      : "bg-warning"
                }`}
              />
              {connectionLabel ? (
                <span className="text-caption text-foreground-subtle">
                  {connectionLabel}
                </span>
              ) : null}
            </div>
            <PaymentTimer remainingSeconds={remainingSeconds} />
          </div>
        }
      />
      <section className="flex flex-1 flex-col gap-6 p-6 lg:flex-row">
        <div className="flex flex-1 items-center justify-center rounded-card border border-border bg-surface">
          <QrSection code={code} totalAmount={totalAmount} />
        </div>
        <OrderSummaryPanel
          items={items}
          totalAmount={totalAmount}
          onCancel={onCancel}
        />
      </section>
    </motion.main>
  );
}
