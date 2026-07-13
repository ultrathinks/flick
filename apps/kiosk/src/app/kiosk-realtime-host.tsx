import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  notifyProductsChanged,
  type PaymentResolution,
  useKioskRealtime,
} from "@/shared/api/use-kiosk-realtime";
import {
  clearKioskData,
  clearPaymentSnapshot,
  getKioskSession,
  getPaymentSnapshot,
  setAlert,
} from "@/shared/model/storage";

export function KioskRealtimeHost() {
  const navigate = useNavigate();
  useLocation();
  const { token } = getKioskSession();

  const handleRevoked = useCallback(() => {
    clearKioskData();
    setAlert("키오스크 연결이 해제되었습니다.");
    navigate("/pairing", { replace: true });
  }, [navigate]);

  const handlePaymentResolved = useCallback(
    (resolution: PaymentResolution) => {
      const snapshot = getPaymentSnapshot();
      if (!snapshot.paymentId || snapshot.paymentId !== resolution.paymentId) {
        return;
      }
      if (resolution.outcome === "completed") {
        navigate("/payment/complete", { replace: true });
        return;
      }
      clearPaymentSnapshot();
      setAlert(
        resolution.reason === "out_of_stock"
          ? "재고가 소진되어 결제가 취소되었습니다"
          : "결제가 취소되었습니다",
      );
      navigate("/products", { replace: true });
    },
    [navigate],
  );

  useKioskRealtime(token, {
    onProductUpdated: notifyProductsChanged,
    onRevoked: handleRevoked,
    onPaymentResolved: handlePaymentResolved,
  });

  return null;
}
