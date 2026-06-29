"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearCartItems,
  clearPaymentSnapshot,
  getPaymentSnapshot,
} from "@/shared/model/storage";
import { PaymentCompleteView } from "@/widgets/payment/ui/payment-complete-view";

export default function PaymentCompletePage() {
  const router = useRouter();
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  useEffect(() => {
    const snapshot = getPaymentSnapshot();

    if (!snapshot.orderId || snapshot.totalAmount <= 0) {
      router.replace("/products");
      return;
    }

    setTotalAmount(snapshot.totalAmount);
  }, [router]);

  function handleBackToProducts() {
    clearPaymentSnapshot();
    clearCartItems();
    router.replace("/products");
  }

  if (totalAmount === null) return null;

  return (
    <PaymentCompleteView
      totalAmount={totalAmount}
      onBackToProducts={handleBackToProducts}
    />
  );
}
