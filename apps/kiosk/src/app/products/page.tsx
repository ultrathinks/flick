"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CartItem } from "@/entities/cart/model/types";
import {
  cancelOrder,
  createOrder,
  createOrderPayment,
} from "@/entities/order/api/orders";
import { getKioskProducts } from "@/entities/product/api/products";
import {
  addProductToCart,
  getCartTotalAmount,
  getCartTotalCount,
  updateCartQuantity,
} from "@/features/cart/model/cart";
import { ApiError } from "@/shared/api/client";
import type { Product } from "@/shared/api/types";
import {
  clearKioskData,
  getCartItems,
  getKioskSession,
  getPaymentSnapshot,
  setCartItems,
  setPaymentSnapshot,
  takeAlert,
} from "@/shared/model/storage";
import { useLocalState } from "@/shared/model/use-local-state";
import { ProductsCatalog } from "@/widgets/products/ui/products-catalog";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [cartItems, setCartItemsState] = useLocalState<CartItem[]>(
    getCartItems,
    setCartItems,
  );

  function showAlert(message: string) {
    setAlertMessage(message);
    window.setTimeout(() => {
      setAlertMessage(null);
    }, 3000);
  }

  useEffect(() => {
    let active = true;

    const storedAlert = takeAlert();
    if (storedAlert) {
      setAlertMessage(storedAlert);
    }

    const paymentSnapshot = getPaymentSnapshot();
    if (
      paymentSnapshot.orderId &&
      paymentSnapshot.expiresAt &&
      Date.parse(paymentSnapshot.expiresAt) > Date.now()
    ) {
      if (active) {
        router.replace("/payment");
      }
      return;
    }

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);

      const { token } = getKioskSession();
      if (!token) {
        router.replace("/pairing");
        return;
      }

      try {
        const kioskProducts = await getKioskProducts(token);
        if (active) {
          setProducts(kioskProducts);
          setIsLoading(false);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearKioskData();
          if (active) {
            router.replace("/pairing");
          }
          return;
        }
        if (active) {
          setErrorMessage("상품을 불러올 수 없습니다");
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleRetry() {
    setIsLoading(true);
    setErrorMessage(null);

    const { token } = getKioskSession();
    if (!token) {
      router.replace("/pairing");
      return;
    }

    try {
      const kioskProducts = await getKioskProducts(token);
      setProducts(kioskProducts);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearKioskData();
        router.replace("/pairing");
        return;
      }
      setErrorMessage("상품을 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  }

  const resolvedCartItems = cartItems ?? [];
  const cartTotalCount = getCartTotalCount(resolvedCartItems);
  const cartTotalAmount = getCartTotalAmount(resolvedCartItems);

  function handleAddProduct(product: Product) {
    if (product.stock <= 0) {
      showAlert("품절된 상품입니다");
      return;
    }
    const currentQuantity =
      resolvedCartItems.find((item) => item.id === product.id)?.quantity ?? 0;
    if (currentQuantity >= product.stock) {
      showAlert("재고가 부족합니다");
      return;
    }
    setCartItemsState((items) => addProductToCart(items, product));
  }

  function handleClearCart() {
    setCartItemsState([]);
  }

  function handleUpdateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCartItemsState((items) => updateCartQuantity(items, productId, 0));
      return;
    }
    const product = products.find((item) => item.id === productId);
    if (product && quantity > product.stock) {
      showAlert("재고가 부족합니다");
      return;
    }
    setCartItemsState((items) =>
      updateCartQuantity(items, productId, quantity),
    );
  }

  async function handleCheckout() {
    if (isCheckingOut) {
      return;
    }
    if (cartTotalCount === 0) {
      showAlert("상품을 선택해주세요");
      return;
    }

    setIsCheckingOut(true);

    const { token } = getKioskSession();
    if (!token) {
      setIsCheckingOut(false);
      router.replace("/pairing");
      return;
    }

    let createdOrderId: string | null = null;

    try {
      const order = await createOrder(
        token,
        resolvedCartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      );
      createdOrderId = order.id;

      const { payment, code } = await createOrderPayment(token, order.id);
      setPaymentSnapshot({
        orderId: order.id,
        paymentId: payment.id,
        code,
        expiresAt: payment.expiresAt,
        totalAmount: order.totalAmount,
        items: resolvedCartItems,
      });
      router.push("/payment");
    } catch (error) {
      if (createdOrderId) {
        try {
          await cancelOrder(token, createdOrderId);
        } catch {}
      }
      if (error instanceof ApiError && error.status === 401) {
        clearKioskData();
        router.replace("/pairing");
        return;
      }
      if (error instanceof ApiError && error.status === 400) {
        showAlert("상품 재고 또는 상태가 변경되었습니다");
        return;
      }
      showAlert("결제 요청을 생성할 수 없습니다");
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <ProductsCatalog
      products={products}
      isLoading={isLoading}
      errorMessage={errorMessage}
      alertMessage={alertMessage}
      cartItems={resolvedCartItems}
      cartTotalAmount={cartTotalAmount}
      cartTotalCount={cartTotalCount}
      isCheckingOut={isCheckingOut}
      onAddProduct={handleAddProduct}
      onClearCart={handleClearCart}
      onUpdateCartQuantity={handleUpdateCartQuantity}
      onCheckout={handleCheckout}
      onRetry={handleRetry}
    />
  );
}
