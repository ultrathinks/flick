import { Button, Money } from "@flick/ui";

export type OrderSummaryItem = {
  name: string;
  quantity: number;
  totalAmount: number;
};

type OrderSummaryPanelProps = {
  items: OrderSummaryItem[];
  totalAmount: number;
  onCancel: () => void;
};

export function OrderSummaryPanel({
  items,
  totalAmount,
  onCancel,
}: OrderSummaryPanelProps) {
  return (
    <aside className="flex w-full flex-col rounded-card border border-border bg-surface lg:w-[360px]">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-heading font-bold text-foreground">주문 내역</h2>
      </div>
      <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {items.map((item) => (
          <li
            key={item.name}
            className="flex items-start justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-semibold text-foreground">
                {item.name}
              </p>
              <p className="mt-0.5 text-caption font-medium text-foreground-faint">
                {item.quantity}개
              </p>
            </div>
            <Money
              amount={item.totalAmount}
              className="shrink-0 text-body font-bold text-foreground"
            />
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-body font-bold text-foreground-subtle">
            합계
          </span>
          <Money
            amount={totalAmount}
            className="text-title font-black text-brand"
          />
        </div>
        <Button
          variant="danger"
          size="lg"
          block
          className="mt-4"
          onClick={onCancel}
        >
          결제 취소
        </Button>
      </div>
    </aside>
  );
}
