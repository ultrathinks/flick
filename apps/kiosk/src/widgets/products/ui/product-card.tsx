import type { Product } from "@/shared/api/types";
import { formatMoney } from "@/shared/lib/format";

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
  const isDisabled = isSoldOut || isAtStockLimit;
  const inCart = cartQuantity > 0;

  return (
    <button
      type="button"
      className={`relative flex h-56 w-full flex-col overflow-hidden rounded-xl border bg-white text-left transition disabled:cursor-not-allowed ${
        inCart ? "border-2 border-indigo-600" : "border-slate-200"
      } ${isSoldOut ? "opacity-70" : "hover:-translate-y-1 hover:shadow-md"}`}
      onClick={() => onAddProduct(product)}
      disabled={isDisabled}
    >
      <div className="relative h-36 w-full bg-slate-200">
        {product.imageUrl ? (
          <div
            role="img"
            aria-label={product.name}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-bold text-slate-300">
            Flick
          </div>
        )}
        {isSoldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-black/60 px-4 py-2 text-lg font-bold text-white">
              품절
            </span>
          </div>
        ) : null}
        {inCart ? (
          <div className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-indigo-600 px-2 text-sm font-bold text-white">
            {cartQuantity}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col justify-between p-3">
        <h2 className="truncate text-base font-semibold text-slate-900">
          {product.name}
        </h2>
        <div>
          <p
            className={`text-base font-bold ${
              isSoldOut ? "text-slate-500" : "text-indigo-600"
            }`}
          >
            {formatMoney(product.price)}
          </p>
          {!isSoldOut ? (
            <p className="mt-1 text-xs font-medium text-slate-500">
              재고: {product.stock}개
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
