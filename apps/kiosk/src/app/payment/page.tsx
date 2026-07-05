"use client";

import { Button } from "@flick/ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CartItem } from "@/entities/cart/model/types";
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
  const [pageError, setPageError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const completedRef = useRef(false);

  const { token } = getKioskSession();

  const { status: sseStatus, lastEvent } = usePaymentSSE(
    snapshot?.paymentId ?? null,
    token,
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
    if (!snapshot?.expiresAt) return;
    const updateRemainingSeconds = () => {
      setRemainingSeconds(getRemainingSeconds(snapshot.expiresAt ?? ""));
    };
    updateRemainingSeconds();
    const intervalId = window.setInterval(updateRemainingSeconds, 1000);
    return () => window.clearInterval(intervalId);
  }, [snapshot?.expiresAt]);

  useEffect(() => {
    if (!lastEvent) return;

    if (completedRef.current) return;

    if (lastEvent.event === "completed") {
      completedRef.current = true;
      router.push("/payment/complete");
      return;
    }
    if (lastEvent.event === "expired" || lastEvent.event === "canceled") {
      completedRef.current = true;
      clearPaymentSnapshot();
      sessionStorage.setItem("flick:alert", "결제가 취소되었습니다");
      router.replace("/products");
    }
  }, [lastEvent, router]);

  useEffect(() => {
    if (remainingSeconds > 0 || cancelledRef.current || completedRef.current) {
      return;
    }
    cancelAndGoBackRef.current();
  }, [remainingSeconds]);

  const cancelAndGoBackRef = useRef(async () => {});
  cancelAndGoBackRef.current = async () => {
    if (cancelledRef.current || completedRef.current) return;
    cancelledRef.current = true;

    if (token && snapshot?.orderId) {
      try {
        await cancelOrder(token, snapshot.orderId);
      } catch (error) {
        console.error("Failed to cancel order:", error);
      }
    }
    clearPaymentSnapshot();
    router.replace("/products");
  };

  useEffect(() => {
    if (snapshot) return;
    const id = setTimeout(() => {
      setPageError("결제 정보를 불러올 수 없습니다");
    }, 10000);
    return () => clearTimeout(id);
  }, [snapshot]);

  function handleCancel() {
    if (!window.confirm("결제를 취소하시겠습니까?")) return;
    cancelAndGoBackRef.current();
  }

  if (pageError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
        <p className="text-subtitle font-medium text-foreground">{pageError}</p>
        <Button
          size="lg"
          className="mt-6"
          onClick={() => router.replace("/products")}
        >
          메뉴로 돌아가기
        </Button>
      </main>
    );
  }

  if (!snapshot?.code || !snapshot.expiresAt) {
    return (
      <main className="min-h-dvh bg-bg">
        <Loading label="결제 정보를 불러오는 중입니다" />
      </main>
    );
  }

  return (
    <PaymentWaiting
      code={snapshot.code}
      totalAmount={snapshot.totalAmount}
      items={(snapshot.items ?? []).map(
        (item: CartItem): OrderSummaryItem => ({
          name: item.name,
          quantity: item.quantity,
          totalAmount: item.price * item.quantity,
        }),
      )}
      remainingSeconds={remainingSeconds}
      isConnected={sseStatus === "connected"}
      onCancel={handleCancel}
    />
  );
}
