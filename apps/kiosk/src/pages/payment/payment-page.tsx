import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { cancelOrder } from "@/entities/order/api/orders";
import {
  type PaymentOutcome,
  usePaymentResolution,
} from "@/features/payment/model/use-payment-resolution";
import {
  clearPaymentSnapshot,
  getKioskSession,
  getPaymentSnapshot,
  setAlert,
} from "@/shared/model/storage";
import type { CartItem, PaymentSnapshot } from "@/shared/model/types";
import { useCountdown } from "@/shared/model/use-countdown";
import { Loading } from "@/shared/ui/loading";
import type { OrderSummaryItem } from "@/widgets/payment/ui/order-summary-panel";
import { PaymentWaiting } from "@/widgets/payment/ui/payment-waiting";

function isValidPaymentSnapshot(snapshot: PaymentSnapshot) {
  return Boolean(
    snapshot.orderId &&
      snapshot.paymentId &&
      snapshot.code &&
      snapshot.expiresAt &&
      !Number.isNaN(Date.parse(snapshot.expiresAt)),
  );
}

function toSummaryItem(item: CartItem): OrderSummaryItem {
  return {
    lineId: item.lineId,
    name: item.name,
    quantity: item.quantity,
    totalAmount: item.price * item.quantity,
    options: item.options.map((option) => option.valueName),
  };
}

export function PaymentPage() {
  const navigate = useNavigate();
  const { token } = getKioskSession();
  const [snapshot, setSnapshot] = useState<PaymentSnapshot | null>(null);

  useEffect(() => {
    const current = getPaymentSnapshot();
    if (!isValidPaymentSnapshot(current)) {
      navigate("/products", { replace: true });
      return;
    }
    setSnapshot(current);
  }, [navigate]);

  const goToProducts = useCallback(
    (alert?: string) => {
      clearPaymentSnapshot();
      if (alert) {
        setAlert(alert);
      }
      navigate("/products", { replace: true });
    },
    [navigate],
  );

  const handleResolved = useCallback(
    (outcome: PaymentOutcome) => {
      if (outcome === "completed") {
        navigate("/payment/complete", { replace: true });
        return;
      }
      goToProducts("결제가 취소되었습니다");
    },
    [navigate, goToProducts],
  );

  const connectionStatus = usePaymentResolution({
    paymentId: snapshot?.paymentId ?? null,
    token,
    onResolved: handleResolved,
  });

  const cancellingRef = useRef(false);
  const cancelOrderAndLeave = useCallback(
    async (alert?: string) => {
      if (cancellingRef.current) {
        return;
      }
      cancellingRef.current = true;
      if (token && snapshot?.orderId) {
        try {
          await cancelOrder(token, snapshot.orderId);
        } catch {}
      }
      goToProducts(alert);
    },
    [token, snapshot?.orderId, goToProducts],
  );

  const remainingSeconds = useCountdown(snapshot?.expiresAt ?? null, () => {
    cancelOrderAndLeave("시간이 초과되어 결제가 취소되었습니다");
  });

  if (!snapshot) {
    return (
      <main className="min-h-dvh bg-bg">
        <Loading label="결제 정보를 불러오는 중입니다" />
      </main>
    );
  }

  return (
    <PaymentWaiting
      code={snapshot.code ?? ""}
      totalAmount={snapshot.totalAmount}
      items={snapshot.items.map(toSummaryItem)}
      remainingSeconds={remainingSeconds}
      connectionStatus={connectionStatus}
      onCancel={() => cancelOrderAndLeave()}
    />
  );
}
