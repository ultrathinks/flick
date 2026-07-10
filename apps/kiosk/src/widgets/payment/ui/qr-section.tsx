import { QRCodeSVG } from "qrcode.react";
import { CodeDisplay } from "@/shared/ui";

type QrSectionProps = {
  code: string;
};

export function QrSection({ code }: QrSectionProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-8">
      <div className="text-center">
        <p className="text-title font-bold text-foreground">
          Flick 앱으로 결제해주세요
        </p>
        <p className="mt-1.5 text-body font-medium text-foreground-subtle">
          QR을 스캔하거나 아래 코드를 입력하세요
        </p>
      </div>

      <div className="rounded-card border border-border bg-white p-5 shadow-[var(--shadow-overlay)]">
        <QRCodeSVG
          value={code}
          size={220}
          level="H"
          fgColor="#191f28"
          bgColor="#ffffff"
        />
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-2">
        <p className="text-caption font-bold text-foreground-subtle">
          결제 코드
        </p>
        <CodeDisplay code={code} size="lg" />
      </div>
    </div>
  );
}
