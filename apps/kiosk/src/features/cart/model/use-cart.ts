import { useCallback } from "react";
import type { Product } from "@/shared/api/types";
import { getCartItems, setCartItems } from "@/shared/model/storage";
import type { CartItem } from "@/shared/model/types";
import { useLocalState } from "@/shared/model/use-local-state";
import {
  addLineToCart,
  getCartTotalAmount,
  getCartTotalCount,
  type OptionSelection,
  productQuantityInCart,
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
    (product: Product, selection: OptionSelection) => {
      if (
        product.status === "soldout" ||
        (product.stock !== null && product.stock <= 0)
      ) {
        onStockLimited("품절된 상품입니다");
        return;
      }
      const current = productQuantityInCart(cartItems, product.id);
      if (product.stock !== null && current >= product.stock) {
        onStockLimited("재고가 부족합니다");
        return;
      }
      setItems((prev) => addLineToCart(prev, product, selection));
    },
    [cartItems, onStockLimited, setItems],
  );

  const changeQuantity = useCallback(
    (lineId: string, quantity: number) => {
      if (quantity > 0) {
        const line = cartItems.find((item) => item.lineId === lineId);
        const product = line
          ? products.find((item) => item.id === line.productId)
          : undefined;
        if (product && product.stock !== null) {
          const others = cartItems.reduce(
            (sum, item) =>
              item.productId === product.id && item.lineId !== lineId
                ? sum + item.quantity
                : sum,
            0,
          );
          if (others + quantity > product.stock) {
            onStockLimited("재고가 부족합니다");
            return;
          }
        }
      }
      setItems((prev) => updateCartQuantity(prev, lineId, quantity));
    },
    [cartItems, products, onStockLimited, setItems],
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
