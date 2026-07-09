import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button, CodeDisplay, Money } from "@/shared/ui";

type QrSectionProps = {
  code: string;
  totalAmount: number;
};

export function QrSection({ code, totalAmount }: QrSectionProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center gap-7 px-6 py-10">
      <div className="text-center">
        <p className="text-title font-bold text-foreground">
          Flick 앱으로 QR을 스캔해주세요
        </p>
        <p className="mt-2 text-body font-medium text-foreground-subtle">
          스캔이 어려우면 코드 번호를 직접 입력할 수 있어요
        </p>
      </div>

      <div className="rounded-card border border-border bg-white p-6 shadow-[var(--shadow-overlay)]">
        <QRCodeSVG
          value={code}
          size={248}
          level="H"
          fgColor="#191f28"
          bgColor="#ffffff"
        />
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-caption font-bold text-foreground-subtle">
          결제 금액
        </p>
        <Money
          amount={totalAmount}
          className="text-display font-black text-brand"
        />
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <Button
          variant="ghost"
          size="lg"
          block
          onClick={() => setShowCode((prev) => !prev)}
        >
          {showCode ? "코드 숨기기" : "코드 번호 보기"}
        </Button>
        {showCode ? <CodeDisplay code={code} size="lg" /> : null}
      </div>
    </div>
  );
}
