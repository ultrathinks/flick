import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  clearCartItems,
  clearPaymentSnapshot,
  getPaymentSnapshot,
} from "@/shared/model/storage";
import { PaymentCompleteView } from "@/widgets/payment/ui/payment-complete-view";

export function PaymentCompletePage() {
  const navigate = useNavigate();
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  useEffect(() => {
    const snapshot = getPaymentSnapshot();

    if (!snapshot.orderId || snapshot.totalAmount <= 0) {
      navigate("/products", { replace: true });
      return;
    }

    setTotalAmount(snapshot.totalAmount);
  }, [navigate]);

  function handleBackToProducts() {
    clearPaymentSnapshot();
    clearCartItems();
    navigate("/products", { replace: true });
  }

  if (totalAmount === null) return null;

  return (
    <PaymentCompleteView
      totalAmount={totalAmount}
      onBackToProducts={handleBackToProducts}
    />
  );
}
