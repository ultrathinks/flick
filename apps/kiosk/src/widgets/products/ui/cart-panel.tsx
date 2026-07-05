import { Button, Money } from "@flick/ui";
import { Minus, Plus, X } from "lucide-react";
import type { CartItem } from "@/entities/cart/model/types";
import type { Product } from "@/shared/api/types";

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
    <aside className="flex min-w-80 basis-1/4 flex-col border-l border-border bg-surface">
      <div className="flex h-20 items-center justify-between border-b border-border p-5">
        <h2 className="text-title font-bold text-foreground">장바구니</h2>
        {items.length > 0 ? (
          <button
            type="button"
            className="rounded-full bg-danger-subtle px-3 py-1.5 text-body font-semibold text-danger transition hover:brightness-95"
            onClick={onClearCart}
          >
            비우기
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-2xl font-black text-foreground-faint">
              0
            </div>
            <p className="mt-4 text-heading font-semibold text-foreground-subtle">
              장바구니가 비어 있어요
            </p>
            <p className="mt-2 text-body font-medium text-foreground-subtle">
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
                  className="flex items-center justify-between border-b border-border py-4"
                  key={item.id}
                >
                  <div className="mr-2 min-w-0 flex-1">
                    <h3 className="truncate text-heading font-semibold text-foreground">
                      {item.name}
                    </h3>
                    <div className="flex items-baseline">
                      <Money
                        amount={item.price * item.quantity}
                        className="text-heading font-semibold text-brand"
                      />
                      <span className="ml-1 text-caption text-foreground-subtle">
                        (<Money amount={item.price} />
                        /개)
                      </span>
                    </div>
                    {maxReached ? (
                      <p className="mt-1 text-caption font-bold text-foreground-faint">
                        최대 수량
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-foreground transition hover:bg-border"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      <Minus className="size-5" strokeWidth={2.5} />
                    </button>
                    <span className="mx-1 min-w-6 text-center text-heading font-semibold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand-hover disabled:opacity-40"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={maxReached}
                    >
                      <Plus className="size-5" strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-subtle text-danger transition hover:brightness-95"
                      onClick={() => onUpdateQuantity(item.id, 0)}
                    >
                      <X className="size-5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-surface p-5">
        <div className="mb-2.5 flex justify-between">
          <span className="text-heading font-medium text-foreground-subtle">
            총 수량
          </span>
          <span className="text-heading font-semibold text-foreground">
            {totalCount}개
          </span>
        </div>
        <div className="mb-2.5 flex justify-between">
          <span className="text-heading font-medium text-foreground-subtle">
            총 금액
          </span>
          <Money
            amount={totalAmount}
            className="text-title font-bold text-brand"
          />
        </div>
        <Button
          size="xl"
          block
          className="mt-4"
          loading={isCheckingOut}
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          결제하기
        </Button>
      </div>
    </aside>
  );
}
