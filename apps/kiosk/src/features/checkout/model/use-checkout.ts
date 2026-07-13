import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import {
  cancelOrder,
  createOrder,
  createOrderPayment,
} from "@/entities/order/api/orders";
import { ApiError, isAuthExpired, isKioskRevoked } from "@/shared/api";
import {
  clearKioskData,
  getKioskSession,
  setPaymentSnapshot,
} from "@/shared/model/storage";
import type { CartItem } from "@/shared/model/types";

type UseCheckoutOptions = {
  onError: (message: string) => void;
};

export function useCheckout({ onError }: UseCheckoutOptions) {
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const checkout = useCallback(
    async (cartItems: CartItem[]) => {
      if (isCheckingOut) {
        return;
      }
      if (cartItems.length === 0) {
        onError("상품을 선택해주세요");
        return;
      }

      const { token } = getKioskSession();
      if (!token) {
        navigate("/pairing", { replace: true });
        return;
      }

      setIsCheckingOut(true);
      let orderId: string | null = null;

      try {
        const order = await createOrder(
          token,
          cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            optionValueIds: item.optionValueIds,
          })),
        );
        orderId = order.id;

        const { payment, code } = await createOrderPayment(token, order.id);
        setPaymentSnapshot({
          orderId: order.id,
          paymentId: payment.id,
          code,
          expiresAt: payment.expiresAt,
          totalAmount: order.totalAmount,
          items: cartItems,
        });
        navigate("/payment");
      } catch (error) {
        if (orderId) {
          try {
            await cancelOrder(token, orderId);
          } catch {}
        }
        if (isAuthExpired(error) || isKioskRevoked(error)) {
          clearKioskData();
          navigate("/pairing", { replace: true });
          return;
        }
        if (error instanceof ApiError && error.status === 400) {
          onError("상품 재고 또는 상태가 변경되었습니다");
          return;
        }
        onError("결제 요청을 생성할 수 없습니다");
      } finally {
        setIsCheckingOut(false);
      }
    },
    [isCheckingOut, navigate, onError],
  );

  return { checkout, isCheckingOut };
}
