import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { resolveSelection } from "@/features/cart/model/cart";
import { useCart } from "@/features/cart/model/use-cart";
import { useKioskProducts } from "@/features/catalog/model/use-kiosk-products";
import { useCheckout } from "@/features/checkout/model/use-checkout";
import { unpairKiosk } from "@/features/kiosk-pairing/api/pair-kiosk";
import type { Product } from "@/shared/api/types";
import { useKioskRealtime } from "@/shared/api/use-kiosk-realtime";
import {
  clearKioskData,
  getKioskSession,
  getPaymentSnapshot,
  setAlert,
  takeAlert,
} from "@/shared/model/storage";
import { useIdleTimeout } from "@/shared/model/use-idle-timeout";
import { useToast } from "@/shared/ui";
import { ProductsCatalog } from "@/widgets/products/ui/products-catalog";

function hasActivePayment() {
  const snapshot = getPaymentSnapshot();
  return Boolean(
    snapshot.orderId &&
      snapshot.expiresAt &&
      Date.parse(snapshot.expiresAt) > Date.now(),
  );
}

const IDLE_RESET_MS = 2 * 60 * 1000;

export function ProductsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (hasActivePayment()) {
      navigate("/payment", { replace: true });
      return;
    }
    const storedAlert = takeAlert();
    if (storedAlert) {
      toast.info(storedAlert);
    }
  }, [navigate, toast]);

  const { products, isLoading, hasError, reload } = useKioskProducts();
  const cart = useCart({ products, onStockLimited: toast.error });
  useIdleTimeout(IDLE_RESET_MS, cart.clear);
  const { checkout, isCheckingOut } = useCheckout({ onError: toast.error });

  useKioskRealtime(getKioskSession().token, {
    onProductUpdated: reload,
    onRevoked: () => {
      clearKioskData();
      setAlert("키오스크 연결이 해제되었습니다.");
      navigate("/pairing", { replace: true });
    },
  });

  const handleAddProduct = useCallback(
    (product: Product, optionValueIds: string[]) => {
      cart.addProduct(product, resolveSelection(product, optionValueIds));
    },
    [cart],
  );

  return (
    <ProductsCatalog
      products={products}
      isLoading={isLoading}
      errorMessage={hasError ? "상품을 불러올 수 없습니다" : null}
      cartItems={cart.cartItems}
      cartTotalAmount={cart.totalAmount}
      cartTotalCount={cart.totalCount}
      isCheckingOut={isCheckingOut}
      onAddProduct={handleAddProduct}
      onClearCart={cart.clear}
      onUpdateCartQuantity={cart.changeQuantity}
      onCheckout={() => checkout(cart.cartItems)}
      onRetry={reload}
      onUnpair={() => {
        const token = getKioskSession().token;
        if (token) {
          void unpairKiosk(token).catch(() => {});
        }
        clearKioskData();
        navigate("/pairing", { replace: true });
      }}
    />
  );
}
