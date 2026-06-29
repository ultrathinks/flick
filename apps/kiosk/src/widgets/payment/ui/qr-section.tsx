import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

type QrSectionProps = {
  code: string;
  totalAmount: number;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function QrSection({ code, totalAmount }: QrSectionProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="h-[200px] w-[200px]">
          <QRCodeSVG
            value={code}
            size={200}
            level="H"
            fgColor="#0f172a"
            bgColor="#ffffff"
          />
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-slate-900">
          QR 코드를 스캔하여 결제를 완료해주세요
        </p>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Flick 앱에서 QR을 스캔하거나 코드를 입력해 결제를 진행해주세요
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-indigo-50 px-5 py-3 text-center">
          <p className="text-xs font-bold text-indigo-600">결제 금액</p>
          <p className="mt-1 text-2xl font-black text-indigo-600">
            {formatMoney(totalAmount)}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="text-sm font-medium text-slate-400 underline underline-offset-2 transition hover:text-slate-600"
        onClick={() => setShowCode((prev) => !prev)}
      >
        {showCode ? "코드 숨기기" : "코드 번호 보기"}
      </button>
      {showCode && (
        <div className="-mt-4 rounded-lg bg-slate-50 px-5 py-3">
          <p className="break-all font-mono text-sm font-bold text-slate-900">
            {code}
          </p>
        </div>
      )}
    </div>
  );
}
