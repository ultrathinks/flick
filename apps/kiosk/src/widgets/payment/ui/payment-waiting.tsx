import { motion } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";
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

function ConnectionBadge({ status }: { status: SSEStatus }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-3 py-1 text-caption font-bold text-success">
        <Wifi className="size-4" strokeWidth={2.5} />
        실시간 확인 중
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-subtle px-3 py-1 text-caption font-bold text-warning">
      <WifiOff className="size-4" strokeWidth={2.5} />
      {status === "disconnected" ? "연결 끊김" : "연결 중"}
    </span>
  );
}

export function PaymentWaiting({
  code,
  totalAmount,
  items,
  remainingSeconds,
  connectionStatus,
  onCancel,
}: PaymentWaitingProps) {
  return (
    <motion.main
      className="flex h-dvh flex-col bg-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <BrandHeader
        right={
          <div className="flex items-center gap-3">
            <ConnectionBadge status={connectionStatus} />
            <PaymentTimer remainingSeconds={remainingSeconds} />
          </div>
        }
      />
      <section className="flex min-h-0 flex-1 gap-6 p-6">
        <div className="flex flex-1 items-center justify-center rounded-card border border-border bg-surface">
          <QrSection code={code} />
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
