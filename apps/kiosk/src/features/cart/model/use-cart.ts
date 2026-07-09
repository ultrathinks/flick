import { useCallback } from "react";
import type { Product } from "@/shared/api/types";
import { getCartItems, setCartItems } from "@/shared/model/storage";
import type { CartItem } from "@/shared/model/types";
import { useLocalState } from "@/shared/model/use-local-state";
import {
  addProductToCart,
  getCartTotalAmount,
  getCartTotalCount,
  updateCartQuantity,
} from "./cart";

type UseCartOptions = {
  products: Product[];
  onStockLimited: (message: string) => void;
};

export function useCart({ products, onStockLimited }: UseCartOptions) {
  const [items, setItems] = useLocalState<CartItem[]>(
    getCartItems,
    setCartItems,
  );
  const cartItems = items ?? [];

  const addProduct = useCallback(
    (product: Product) => {
      if (product.stock <= 0) {
        onStockLimited("품절된 상품입니다");
        return;
      }
      const current =
        cartItems.find((item) => item.id === product.id)?.quantity ?? 0;
      if (current >= product.stock) {
        onStockLimited("재고가 부족합니다");
        return;
      }
      setItems((prev) => addProductToCart(prev, product));
    },
    [cartItems, onStockLimited, setItems],
  );

  const changeQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity > 0) {
        const product = products.find((item) => item.id === productId);
        if (product && quantity > product.stock) {
          onStockLimited("재고가 부족합니다");
          return;
        }
      }
      setItems((prev) => updateCartQuantity(prev, productId, quantity));
    },
    [products, onStockLimited, setItems],
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  return {
    cartItems,
    totalCount: getCartTotalCount(cartItems),
    totalAmount: getCartTotalAmount(cartItems),
    addProduct,
    changeQuantity,
    clear,
  };
}
