import type { CartItem } from "@/entities/cart/model/types";
import type { Product } from "@/shared/api/types";
import { formatMoney } from "@/shared/lib/format";

type CartPanelProps = {
  items: CartItem[];
  products: Product[];
  totalAmount: number;
  totalCount: number;
  isCheckingOut: boolean;
  onClearCart: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onCheckout: () => void;
};

export function CartPanel({
  items,
  products,
  totalAmount,
  totalCount,
  isCheckingOut,
  onClearCart,
  onUpdateQuantity,
  onCheckout,
}: CartPanelProps) {
  return (
    <aside className="flex min-w-80 basis-1/4 flex-col border-l border-slate-100 bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-xl font-bold text-slate-900">장바구니</h2>
        {items.length > 0 ? (
          <button
            type="button"
            className="rounded-full bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600"
            onClick={onClearCart}
          >
            비우기
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl font-black text-slate-300">
              0
            </div>
            <p className="mt-4 text-base font-semibold text-slate-500">
              장바구니가 비어있습니다
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              상품을 선택해주세요
            </p>
          </div>
        ) : (
          <div className="px-5">
            {items.map((item) => {
              const product = products.find((entry) => entry.id === item.id);
              const maxReached = product
                ? item.quantity >= product.stock
                : false;

              return (
                <div
                  className="flex items-center justify-between border-b border-slate-100 py-4"
                  key={item.id}
                >
                  <button
                    type="button"
                    className="mr-2 min-w-0 flex-1 text-left"
                  >
                    <h3 className="truncate text-base font-semibold text-slate-900">
                      {item.name}
                    </h3>
                    <div className="flex items-baseline">
                      <span className="text-base font-semibold text-indigo-600">
                        {formatMoney(item.price * item.quantity)}
                      </span>
                      <span className="ml-1 text-xs text-slate-500">
                        ({formatMoney(item.price)}/개)
                      </span>
                    </div>
                    {maxReached ? (
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        최대 수량
                      </p>
                    ) : null}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-lg font-bold leading-none text-white transition hover:bg-indigo-600"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span className="mx-3 min-w-6 text-center text-base font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold leading-none text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={maxReached}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-sm font-black text-red-500 transition hover:bg-red-100"
                      onClick={() => onUpdateQuantity(item.id, 0)}
                    >
                      x
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-white p-5">
        <div className="mb-2.5 flex justify-between">
          <span className="text-base font-medium text-slate-500">총 수량</span>
          <span className="text-base font-semibold text-slate-900">
            {totalCount}개
          </span>
        </div>
        <div className="mb-2.5 flex justify-between">
          <span className="text-base font-medium text-slate-500">총 금액</span>
          <span className="text-xl font-bold text-indigo-600">
            {formatMoney(totalAmount)}
          </span>
        </div>
        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
          disabled={items.length === 0 || isCheckingOut}
          onClick={onCheckout}
        >
          {isCheckingOut ? "결제 준비 중" : "결제하기"}
        </button>
      </div>
    </aside>
  );
}
