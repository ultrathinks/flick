import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import type { Product } from "@/shared/api/types";
import type { CartItem } from "@/shared/model/types";
import { Button, Money, useConfirm } from "@/shared/ui";

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
  const confirm = useConfirm();
  const isEmpty = items.length === 0;

  async function handleClearCart() {
    const ok = await confirm({
      tone: "danger",
      title: "장바구니를 비울까요?",
      description: "담긴 상품이 모두 삭제됩니다.",
      confirmLabel: "비우기",
    });
    if (ok) {
      onClearCart();
    }
  }

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex h-20 items-center justify-between border-b border-border px-6">
        <h2 className="text-title font-bold text-foreground">
          장바구니
          {totalCount > 0 ? (
            <span className="ml-2 text-brand">{totalCount}</span>
          ) : null}
        </h2>
        {!isEmpty ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground-subtle hover:text-danger"
            onClick={handleClearCart}
          >
            비우기
          </Button>
        ) : null}
      </div>

      <div className="flex-1 overflow-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-surface-muted text-foreground-faint">
              <ShoppingCart className="size-8" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-heading font-semibold text-foreground-subtle">
              담긴 상품이 없어요
            </p>
            <p className="mt-1 text-body font-medium text-foreground-faint">
              메뉴를 선택해주세요
            </p>
          </div>
        ) : (
          <div className="px-6">
            {items.map((item) => {
              const product = products.find((entry) => entry.id === item.id);
              const maxReached = product
                ? item.quantity >= product.stock
                : false;

              return (
                <div
                  className="flex flex-col gap-3 border-b border-border py-4"
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-heading font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 text-caption text-foreground-subtle">
                        <Money amount={item.price} />
                        /개
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="삭제"
                      className="-mr-1 shrink-0 text-foreground-subtle hover:text-danger"
                      onClick={() => onUpdateQuantity(item.id, 0)}
                    >
                      <X strokeWidth={2} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Money
                      amount={item.price * item.quantity}
                      className="text-subtitle font-bold text-brand"
                    />
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="neutral"
                        size="icon-lg"
                        aria-label="수량 줄이기"
                        className="rounded-full"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus strokeWidth={2.5} />
                      </Button>
                      <span className="min-w-8 text-center text-heading font-bold tabular-nums text-foreground">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon-lg"
                        aria-label="수량 늘리기"
                        className="rounded-full"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={maxReached}
                      >
                        <Plus strokeWidth={2.5} />
                      </Button>
                    </div>
                  </div>
                  {maxReached ? (
                    <p className="text-caption font-bold text-foreground-faint">
                      최대 수량이에요
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-surface p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-heading font-medium text-foreground-subtle">
            총 결제 금액
          </span>
          <Money
            amount={totalAmount}
            className="text-display font-black text-brand"
          />
        </div>
        <Button
          size="xl"
          block
          loading={isCheckingOut}
          disabled={isEmpty}
          onClick={onCheckout}
        >
          결제하기
        </Button>
      </div>
    </aside>
  );
}
