import type { CartItem } from "@/entities/cart/model/types";
import type { Product } from "@/shared/api/types";

export function addProductToCart(items: CartItem[], product: Product) {
  const existing = items.find((item) => item.id === product.id);
  if (existing) {
    return items.map((item) =>
      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
    );
  }
  return [
    ...items,
    { id: product.id, name: product.name, price: product.price, quantity: 1 },
  ];
}

export function updateCartQuantity(
  items: CartItem[],
  productId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    return items.filter((item) => item.id !== productId);
  }
  return items.map((item) =>
    item.id === productId ? { ...item, quantity } : item,
  );
}

export function getCartTotalAmount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartTotalCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
