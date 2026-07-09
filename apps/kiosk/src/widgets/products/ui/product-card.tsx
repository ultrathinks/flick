import { ImageIcon } from "lucide-react";
import type { Product } from "@/shared/api/types";
import { Money } from "@/shared/ui";

type ProductCardProps = {
  product: Product;
  cartQuantity: number;
  onPick: (product: Product) => void;
};

export function ProductCard({
  product,
  cartQuantity,
  onPick,
}: ProductCardProps) {
  const isSoldOut =
    product.status === "soldout" ||
    (product.stock !== null && product.stock <= 0);
  const isAtStockLimit =
    product.stock !== null && cartQuantity >= product.stock;
  const inCart = cartQuantity > 0;
  const hasOptions = product.optionGroups.length > 0;

  return (
    <button
      type="button"
      disabled={isSoldOut}
      className={`group relative flex w-full flex-col overflow-hidden rounded-card border bg-surface text-left transition disabled:cursor-not-allowed ${
        inCart ? "border-brand ring-1 ring-brand" : "border-border"
      } ${
        isSoldOut
          ? "opacity-60"
          : "active:-translate-y-0.5 active:shadow-[var(--shadow-overlay)]"
      }`}
      onClick={() => onPick(product)}
    >
      <div className="relative aspect-[4/3] w-full bg-surface-muted">
        {product.imageUrl ? (
          <div
            role="img"
            aria-label={product.name}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground-faint">
            <ImageIcon className="size-10" strokeWidth={1.5} />
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
          <div className="absolute right-2 top-2 flex h-9 min-w-9 items-center justify-center rounded-full bg-brand px-2 text-heading font-bold text-brand-foreground shadow-[var(--shadow-overlay)]">
            {cartQuantity}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="line-clamp-2 text-title font-semibold text-foreground">
          {product.name}
        </h2>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <Money
            amount={product.price}
            className={`text-title font-bold ${
              isSoldOut ? "text-foreground-subtle" : "text-brand"
            }`}
          />
          {isSoldOut ? null : hasOptions ? (
            <span className="shrink-0 text-caption font-bold text-foreground-subtle">
              옵션 선택
            </span>
          ) : product.stock !== null ? (
            <span
              className={`shrink-0 text-caption font-bold ${
                isAtStockLimit ? "text-danger" : "text-foreground-subtle"
              }`}
            >
              {isAtStockLimit ? "최대 수량" : `${product.stock}개 남음`}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
