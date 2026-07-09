import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useCart } from "@/features/cart/model/use-cart";
import { useKioskProducts } from "@/features/catalog/model/use-kiosk-products";
import { useCheckout } from "@/features/checkout/model/use-checkout";
import { getPaymentSnapshot, takeAlert } from "@/shared/model/storage";
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
  const { checkout, isCheckingOut } = useCheckout({ onError: toast.error });

  return (
    <ProductsCatalog
      products={products}
      isLoading={isLoading}
      errorMessage={hasError ? "상품을 불러올 수 없습니다" : null}
      cartItems={cart.cartItems}
      cartTotalAmount={cart.totalAmount}
      cartTotalCount={cart.totalCount}
      isCheckingOut={isCheckingOut}
      onAddProduct={cart.addProduct}
      onClearCart={cart.clear}
      onUpdateCartQuantity={cart.changeQuantity}
      onCheckout={() => checkout(cart.cartItems)}
      onRetry={reload}
    />
  );
}
