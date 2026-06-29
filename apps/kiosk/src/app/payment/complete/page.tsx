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
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const snapshot = getPaymentSnapshot();
    setTotalAmount(snapshot.totalAmount);
    clearPaymentSnapshot();
  }, []);

  function handleBackToProducts() {
    clearCartItems();
    router.replace("/products");
  }

  return (
    <PaymentCompleteView
      totalAmount={totalAmount}
      onBackToProducts={handleBackToProducts}
    />
  );
}
