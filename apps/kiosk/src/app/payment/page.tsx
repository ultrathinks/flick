"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cancelOrder } from "@/entities/order/api/orders";
import type { PaymentSnapshot } from "@/entities/payment/model/types";
import { usePaymentSSE } from "@/shared/api/use-payment-sse";
import {
  clearPaymentSnapshot,
  getKioskSession,
  getPaymentSnapshot,
} from "@/shared/model/storage";
import { Loading } from "@/shared/ui/loading";
import type { OrderSummaryItem } from "@/widgets/payment/ui/order-summary-panel";
import { PaymentWaiting } from "@/widgets/payment/ui/payment-waiting";

const MOCK_ITEMS: OrderSummaryItem[] = [
  { name: "아이스 아메리카노", quantity: 2, totalAmount: 5000 },
  { name: "딸기 라떼", quantity: 1, totalAmount: 3500 },
];

const bypassKioskAuth = process.env.NEXT_PUBLIC_BYPASS_KIOSK_AUTH === "true";

function getRemainingSeconds(expiresAt: string) {
  const timestamp = Date.parse(expiresAt);
  if (Number.isNaN(timestamp)) {
    return 0;
  }
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

function isValidPaymentSnapshot(snapshot: PaymentSnapshot) {
  return Boolean(
    snapshot.orderId &&
      snapshot.paymentId &&
      snapshot.code &&
      snapshot.expiresAt &&
      !Number.isNaN(Date.parse(snapshot.expiresAt)),
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<PaymentSnapshot | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const cancelledRef = useRef(false);

  const { token } = getKioskSession();

  const { status: sseStatus, lastEvent } = usePaymentSSE(
    !bypassKioskAuth ? (snapshot?.paymentId ?? null) : null,
    !bypassKioskAuth ? token : null,
  );

  useEffect(() => {
    const currentSnapshot = getPaymentSnapshot();
    if (!isValidPaymentSnapshot(currentSnapshot)) {
      router.replace("/products");
      return;
    }
    setSnapshot(currentSnapshot);
    setRemainingSeconds(getRemainingSeconds(currentSnapshot.expiresAt ?? ""));
  }, [router]);

  useEffect(() => {
    if (!snapshot?.expiresAt) {
      return;
    }
    const updateRemainingSeconds = () => {
      setRemainingSeconds(getRemainingSeconds(snapshot.expiresAt ?? ""));
    };
    updateRemainingSeconds();
    const intervalId = window.setInterval(updateRemainingSeconds, 1000);
    return () => window.clearInterval(intervalId);
  }, [snapshot?.expiresAt]);

  useEffect(() => {
    if (!lastEvent) {
      return;
    }
    if (lastEvent.event === "completed") {
      router.push("/payment/complete");
      return;
    }
    if (lastEvent.event === "expired" || lastEvent.event === "canceled") {
      clearPaymentSnapshot();
      router.replace("/products");
    }
  }, [lastEvent, router]);

  const cancelAndGoBackRef = useRef(async () => {});

  cancelAndGoBackRef.current = async () => {
    if (cancelledRef.current) {
      return;
    }
    cancelledRef.current = true;

    if (!bypassKioskAuth && token && snapshot?.orderId) {
      try {
        await cancelOrder(token, snapshot.orderId);
      } catch {
        /* proceed with local cleanup even if API fails */
      }
    }
    clearPaymentSnapshot();
    router.replace("/products");
  };

  useEffect(() => {
    if (remainingSeconds > 0 || cancelledRef.current) {
      return;
    }
    cancelAndGoBackRef.current();
  }, [remainingSeconds]);

  if (!snapshot?.code || !snapshot.expiresAt) {
    return (
      <main className="min-h-dvh bg-white">
        <Loading label="결제 정보를 불러오는 중입니다" />
      </main>
    );
  }

  return (
    <>
      <PaymentWaiting
        code={snapshot.code}
        totalAmount={snapshot.totalAmount}
        items={MOCK_ITEMS}
        remainingSeconds={remainingSeconds}
        isConnected={sseStatus === "connected"}
        onCancel={() => cancelAndGoBackRef.current()}
      />
      {bypassKioskAuth && remainingSeconds > 0 && (
        <button
          type="button"
          className="fixed bottom-6 right-6 z-50 rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-green-600"
          onClick={() => router.push("/payment/complete")}
        >
          테스트: 결제 완료
        </button>
      )}
    </>
  );
}
