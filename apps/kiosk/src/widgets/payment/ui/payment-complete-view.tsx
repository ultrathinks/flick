import { useEffect, useRef, useState } from "react";

type PaymentCompleteViewProps = {
  totalAmount: number;
  onBackToProducts: () => void;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatPaymentTime(now: Date) {
  return `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, "0")}. ${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function PaymentCompleteView({
  totalAmount,
  onBackToProducts,
}: PaymentCompleteViewProps) {
  const [countdown, setCountdown] = useState(10);
  const onBackToProductsRef = useRef(onBackToProducts);
  onBackToProductsRef.current = onBackToProducts;

  useEffect(() => {
    if (countdown <= 0) {
      onBackToProductsRef.current();
      return;
    }
    const id = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
      <svg
        className="h-28 w-28 text-green-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <title>check</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <h1 className="mt-6 text-4xl font-bold text-slate-900">결제 완료</h1>
      <p className="mt-3 text-lg font-medium text-slate-500">
        주문이 성공적으로 완료되었습니다
      </p>
      <div className="mt-10 grid w-full max-w-sm grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-50 p-5">
          <p className="text-xs font-bold text-slate-500">결제 금액</p>
          <p className="mt-2 text-2xl font-black text-indigo-600">
            {formatMoney(totalAmount)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-5">
          <p className="text-xs font-bold text-slate-500">결제 시간</p>
          <p className="mt-2 text-base font-bold text-slate-900">
            {formatPaymentTime(new Date())}
          </p>
        </div>
      </div>
      <p className="mt-10 text-sm font-medium text-slate-400">
        {countdown}초 후 자동으로 화면이 전환됩니다
      </p>
      <button
        type="button"
        className="mt-4 flex w-full max-w-sm items-center justify-center rounded-xl bg-slate-900 py-4 text-base font-bold text-white transition hover:bg-slate-700"
        onClick={onBackToProducts}
      >
        메뉴로 돌아가기
      </button>
    </main>
  );
}
