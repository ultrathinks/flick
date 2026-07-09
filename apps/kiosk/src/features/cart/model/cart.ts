import type { OptionValue, Product } from "@/shared/api/types";
import type { CartItem, CartLineOption } from "@/shared/model/types";

export type OptionSelection = {
  optionValueIds: string[];
  options: CartLineOption[];
  priceDelta: number;
};

export function buildLineId(productId: string, optionValueIds: string[]) {
  const sorted = [...optionValueIds].sort();
  return sorted.length > 0 ? `${productId}::${sorted.join(",")}` : productId;
}

export function resolveSelection(
  product: Product,
  optionValueIds: string[],
): OptionSelection {
  const valueById = new Map<string, { group: string; value: OptionValue }>();
  for (const group of product.optionGroups) {
    for (const value of group.values) {
      valueById.set(value.id, { group: group.name, value });
    }
  }
  const options: CartLineOption[] = [];
  let priceDelta = 0;
  for (const id of optionValueIds) {
    const entry = valueById.get(id);
    if (!entry) {
      continue;
    }
    options.push({
      groupName: entry.group,
      valueName: entry.value.name,
      priceDelta: entry.value.priceDelta,
    });
    priceDelta += entry.value.priceDelta;
  }
  return { optionValueIds, options, priceDelta };
}

export function addLineToCart(
  items: CartItem[],
  product: Product,
  selection: OptionSelection,
) {
  const lineId = buildLineId(product.id, selection.optionValueIds);
  const existing = items.find((item) => item.lineId === lineId);
  if (existing) {
    return items.map((item) =>
      item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item,
    );
  }
  return [
    ...items,
    {
      lineId,
      productId: product.id,
      name: product.name,
      price: product.price + selection.priceDelta,
      quantity: 1,
      optionValueIds: selection.optionValueIds,
      options: selection.options,
    },
  ];
}

export function updateCartQuantity(
  items: CartItem[],
  lineId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    return items.filter((item) => item.lineId !== lineId);
  }
  return items.map((item) =>
    item.lineId === lineId ? { ...item, quantity } : item,
  );
}

export function productQuantityInCart(items: CartItem[], productId: string) {
  return items.reduce(
    (sum, item) => (item.productId === productId ? sum + item.quantity : sum),
    0,
  );
}

export function getCartTotalAmount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartTotalCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
