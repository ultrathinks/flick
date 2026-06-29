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

function formatMoney(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function OrderSummaryPanel({
  items,
  totalAmount,
  onCancel,
}: OrderSummaryPanelProps) {
  return (
    <aside className="flex w-full flex-col rounded-xl border border-slate-200 bg-white lg:w-[360px]">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold text-slate-900">주문 내역</h2>
      </div>
      <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {items.map((item) => (
          <li
            key={item.name}
            className="flex items-start justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {item.name}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                {item.quantity}개
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-slate-900">
              {formatMoney(item.totalAmount)}
            </p>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-500">합계</span>
          <span className="text-xl font-black text-indigo-600">
            {formatMoney(totalAmount)}
          </span>
        </div>
        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-red-500 py-3.5 text-base font-bold text-white transition hover:bg-red-600"
          onClick={onCancel}
        >
          결제 취소
        </button>
      </div>
    </aside>
  );
}
