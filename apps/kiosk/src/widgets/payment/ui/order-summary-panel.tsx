import { Button, Money, useConfirm } from "@/shared/ui";

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
  const confirm = useConfirm();

  async function handleCancel() {
    const ok = await confirm({
      tone: "danger",
      title: "결제를 취소할까요?",
      description: "진행 중인 결제가 취소돼요.",
      confirmLabel: "결제 취소",
    });
    if (ok) {
      onCancel();
    }
  }

  return (
    <aside className="flex w-[380px] shrink-0 flex-col rounded-card border border-border bg-surface">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-title font-bold text-foreground">주문 내역</h2>
      </div>
      <ul className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {items.map((item) => (
          <li
            key={item.name}
            className="flex items-start justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-heading font-semibold text-foreground">
                {item.name}
              </p>
              <p className="mt-0.5 text-caption font-medium text-foreground-faint">
                {item.quantity}개
              </p>
            </div>
            <Money
              amount={item.totalAmount}
              className="shrink-0 text-heading font-bold text-foreground"
            />
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <span className="text-heading font-bold text-foreground-subtle">
            합계
          </span>
          <Money
            amount={totalAmount}
            className="text-title font-black text-brand"
          />
        </div>
        <Button
          variant="danger"
          size="xl"
          block
          className="mt-4"
          onClick={handleCancel}
        >
          결제 취소
        </Button>
      </div>
    </aside>
  );
}
