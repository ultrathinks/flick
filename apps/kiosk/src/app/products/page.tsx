"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CartItem } from "@/entities/cart/model/types";
import { createOrder, createOrderPayment } from "@/entities/order/api/orders";
import { getKioskProducts } from "@/entities/product/api/products";
import {
  addProductToCart,
  getCartTotalAmount,
  getCartTotalCount,
  updateCartQuantity,
} from "@/features/cart/model/cart";
import { getCurrentKiosk } from "@/features/kiosk-pairing/api/pair-kiosk";
import { ApiError } from "@/shared/api/client";
import type { Booth, Kiosk, Product } from "@/shared/api/types";
import {
  clearKioskData,
  getCartItems,
  getKioskSession,
  setCartItems,
  setPaymentSnapshot,
} from "@/shared/model/storage";
import { useLocalState } from "@/shared/model/use-local-state";
import { ProductsCatalog } from "@/widgets/products/ui/products-catalog";

type KioskContext = {
  kiosk: Kiosk;
  booth: Booth;
};

const bypassKioskAuth = process.env.NEXT_PUBLIC_BYPASS_KIOSK_AUTH === "true";

const mockContext: KioskContext = {
  kiosk: {
    id: "mock-kiosk",
    boothId: "mock-booth",
    name: "개발용 키오스크",
    revokedAt: null,
    createdAt: new Date(0).toISOString(),
  },
  booth: {
    id: "mock-booth",
    name: "개발용 부스",
    description: null,
    status: "approved",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
};

const mockProducts: Product[] = [
  {
    id: "mock-product-1",
    boothId: "mock-booth",
    name: "아이스 아메리카노",
    description: null,
    imageUrl: null,
    price: 2500,
    stock: 24,
    status: "available",
    sortOrder: 1,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "mock-product-2",
    boothId: "mock-booth",
    name: "딸기 라떼",
    description: null,
    imageUrl: null,
    price: 3500,
    stock: 12,
    status: "available",
    sortOrder: 2,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "mock-product-3",
    boothId: "mock-booth",
    name: "초코 쿠키",
    description: null,
    imageUrl: null,
    price: 1800,
    stock: 18,
    status: "available",
    sortOrder: 3,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "mock-product-4",
    boothId: "mock-booth",
    name: "품절 상품",
    description: null,
    imageUrl: null,
    price: 3000,
    stock: 0,
    status: "available",
    sortOrder: 4,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

export default function ProductsPage() {
  const router = useRouter();
  const [context, setContext] = useState<KioskContext | null>(null);
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

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);
      if (bypassKioskAuth) {
        if (active) {
          setContext(mockContext);
          setProducts(mockProducts);
          setIsLoading(false);
        }
        return;
      }

      const { token } = getKioskSession();
      if (!token) {
        router.replace("/pairing");
        return;
      }

      try {
        const [currentKiosk, kioskProducts] = await Promise.all([
          getCurrentKiosk(token),
          getKioskProducts(token),
        ]);
        if (active) {
          setContext(currentKiosk);
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

    if (bypassKioskAuth) {
      setContext(mockContext);
      setProducts(mockProducts);
      setIsLoading(false);
      return;
    }

    const { token } = getKioskSession();
    if (!token) {
      router.replace("/pairing");
      return;
    }

    try {
      const [currentKiosk, kioskProducts] = await Promise.all([
        getCurrentKiosk(token),
        getKioskProducts(token),
      ]);
      setContext(currentKiosk);
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

    if (bypassKioskAuth) {
      setPaymentSnapshot({
        orderId: "mock-order",
        paymentId: "mock-payment",
        code: "mock-kiosk-payment-code-001",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        totalAmount: cartTotalAmount,
      });
      router.push("/payment");
      setIsCheckingOut(false);
      return;
    }

    const { token } = getKioskSession();
    if (!token) {
      setIsCheckingOut(false);
      router.replace("/pairing");
      return;
    }

    try {
      const order = await createOrder(
        token,
        resolvedCartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      );
      const { payment, code } = await createOrderPayment(token, order.id);
      setPaymentSnapshot({
        orderId: order.id,
        paymentId: payment.id,
        code,
        expiresAt: payment.expiresAt,
        totalAmount: order.totalAmount,
      });
      router.push("/payment");
    } catch (error) {
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
      context={context}
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
