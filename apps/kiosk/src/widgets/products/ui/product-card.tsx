import type { Product } from "@/shared/api/types";
import { Money } from "@/shared/ui";

type ProductCardProps = {
  product: Product;
  cartQuantity: number;
  onAddProduct: (product: Product) => void;
};

export function ProductCard({
  product,
  cartQuantity,
  onAddProduct,
}: ProductCardProps) {
  const isSoldOut = product.stock <= 0;
  const isAtStockLimit = cartQuantity >= product.stock;
  const inCart = cartQuantity > 0;

  return (
    <button
      type="button"
      className={`relative flex h-64 w-full flex-col overflow-hidden rounded-card border bg-surface text-left transition disabled:cursor-not-allowed ${
        inCart ? "border-brand" : "border-border"
      } ${
        isSoldOut
          ? "opacity-70"
          : "hover:-translate-y-1 hover:shadow-[var(--shadow-overlay)] active:-translate-y-0.5"
      } ${isAtStockLimit && !isSoldOut ? "bg-surface-muted" : ""}`}
      onClick={() => onAddProduct(product)}
    >
      <div className="relative h-40 w-full bg-surface-muted">
        {product.imageUrl ? (
          <div
            role="img"
            aria-label={product.name}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-muted text-body font-bold text-foreground-faint">
            Flick
          </div>
        )}
        {isSoldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-scrim">
            <span className="rounded-full bg-foreground px-4 py-2 text-subtitle font-bold text-surface">
              품절
            </span>
          </div>
        ) : null}
        {inCart ? (
          <div className="absolute right-2 top-2 flex h-9 min-w-9 items-center justify-center rounded-full bg-brand px-2 text-heading font-bold text-brand-foreground">
            {cartQuantity}
          </div>
        ) : null}
        {isAtStockLimit && !isSoldOut ? (
          <div className="absolute bottom-2 right-2 rounded-full bg-foreground px-3 py-1 text-caption font-bold text-surface">
            최대
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <h2 className="truncate text-subtitle font-semibold text-foreground">
          {product.name}
        </h2>
        <div>
          <Money
            amount={product.price}
            className={`block text-title font-bold ${
              isSoldOut ? "text-foreground-subtle" : "text-brand"
            }`}
          />
          {!isSoldOut ? (
            <p className="mt-1 text-body font-medium text-foreground-subtle">
              재고: {product.stock}개
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
