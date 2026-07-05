import { Money } from "@flick/ui";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

type QrSectionProps = {
  code: string;
  totalAmount: number;
};

export function QrSection({ code, totalAmount }: QrSectionProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <div className="rounded-card border border-border bg-white p-5">
        <div className="h-[240px] w-[240px]">
          <QRCodeSVG
            value={code}
            size={240}
            level="H"
            fgColor="#0f172a"
            bgColor="#ffffff"
          />
        </div>
      </div>
      <div className="text-center">
        <p className="text-subtitle font-bold text-foreground">
          QR 코드를 스캔하여 결제를 완료해주세요
        </p>
        <p className="mt-1 text-body font-medium text-foreground-subtle">
          Flick 앱에서 QR을 스캔하거나 코드를 입력해 결제를 진행해주세요
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-card-sm bg-brand-subtle px-6 py-4 text-center">
          <p className="text-caption font-bold text-brand">결제 금액</p>
          <Money
            amount={totalAmount}
            className="mt-1 block text-display font-black text-brand"
          />
        </div>
      </div>
      <button
        type="button"
        className="text-body font-medium text-foreground-faint underline underline-offset-2 transition hover:text-foreground-subtle"
        onClick={() => setShowCode((prev) => !prev)}
      >
        {showCode ? "코드 숨기기" : "코드 번호 보기"}
      </button>
      {showCode && (
        <div className="-mt-4 rounded-card-sm bg-surface-muted px-5 py-3">
          <p className="break-all font-mono text-body font-bold text-foreground">
            {code}
          </p>
        </div>
      )}
    </div>
  );
}
