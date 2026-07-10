import { useState } from "react";
import { productQuantityInCart } from "@/features/cart/model/cart";
import type { Product } from "@/shared/api/types";
import type { CartItem } from "@/shared/model/types";
import { BrandHeader } from "@/shared/ui/brand-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { CartPanel } from "./cart-panel";
import { KioskSettings } from "./kiosk-settings";
import { OptionSheet } from "./option-sheet";
import { ProductCard } from "./product-card";
import { ProductCardSkeleton } from "./product-card-skeleton";
import { ProductsErrorState } from "./products-error-state";

type ProductsCatalogProps = {
  products: Product[];
  isLoading: boolean;
  errorMessage: string | null;
  cartItems: CartItem[];
  cartTotalAmount: number;
  cartTotalCount: number;
  isCheckingOut: boolean;
  boothName?: string | null;
  kioskName?: string | null;
  onAddProduct: (product: Product, optionValueIds: string[]) => void;
  onClearCart: () => void;
  onUpdateCartQuantity: (lineId: string, quantity: number) => void;
  onCheckout: () => void;
  onRetry: () => void;
  onUnpair?: () => void;
};

export function ProductsCatalog({
  products,
  isLoading,
  errorMessage,
  cartItems,
  cartTotalAmount,
  cartTotalCount,
  isCheckingOut,
  onAddProduct,
  onClearCart,
  onUpdateCartQuantity,
  onCheckout,
  onRetry,
  onUnpair,
  boothName,
  kioskName,
}: ProductsCatalogProps) {
  const [optionProduct, setOptionProduct] = useState<Product | null>(null);

  const handlePick = (product: Product) => {
    if (product.optionGroups.length > 0) {
      setOptionProduct(product);
      return;
    }
    onAddProduct(product, []);
  };

  return (
    <main className="flex h-dvh flex-col bg-bg">
      <BrandHeader
        right={
          onUnpair ? (
            <KioskSettings
              boothName={boothName}
              kioskName={kioskName}
              onUnpair={onUnpair}
            />
          ) : undefined
        }
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex-1 overflow-auto bg-bg p-6">
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
                <ProductCardSkeleton key={key} />
              ))}
            </div>
          ) : errorMessage ? (
            <ProductsErrorState onRetry={onRetry} />
          ) : products.length === 0 ? (
            <EmptyState
              className="h-full"
              title="판매 중인 상품이 없습니다"
              description="부스 관리 화면에서 상품 상태를 확인해주세요"
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={productQuantityInCart(cartItems, product.id)}
                  onPick={handlePick}
                />
              ))}
            </div>
          )}
        </section>
        <CartPanel
          items={cartItems}
          products={products}
          totalAmount={cartTotalAmount}
          totalCount={cartTotalCount}
          isCheckingOut={isCheckingOut}
          onClearCart={onClearCart}
          onUpdateQuantity={onUpdateCartQuantity}
          onCheckout={onCheckout}
        />
      </div>
      <OptionSheet
        product={optionProduct}
        onClose={() => setOptionProduct(null)}
        onConfirm={(product, optionValueIds) => {
          onAddProduct(product, optionValueIds);
          setOptionProduct(null);
        }}
      />
    </main>
  );
}
