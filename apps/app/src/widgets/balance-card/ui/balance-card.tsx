import { useRouter } from "@b1nd/aid-kit/navigation";
import { RollingNumber } from "@flick/ui";
import { usePayByCode } from "@/features/pay-by-code";
import { type CardTheme, defaultCardTheme } from "../model/card-theme.ts";
import { CardFace } from "./card-face.tsx";

interface BalanceCardProps {
  balance: number;
  theme?: CardTheme;
}

export const BalanceCard = ({
  balance,
  theme = defaultCardTheme,
}: BalanceCardProps) => {
  const { stack } = useRouter();
  const { scan } = usePayByCode();

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={scan}
        aria-label="QR 스캔하여 결제하기"
        className="relative block aspect-[1.586/1] w-full overflow-hidden rounded-card shadow-overlay transition-transform active:scale-[0.98]"
      >
        <CardFace theme={theme} />
      </button>

      <div className="flex items-center justify-between rounded-card border border-border bg-surface px-5 py-4">
        <div className="min-w-0">
          <p className="text-caption text-foreground-subtle">잔액</p>
          <RollingNumber
            value={balance}
            className="block truncate text-title font-bold text-foreground"
          />
        </div>
        <button
          type="button"
          onClick={() => stack.push("/my-code")}
          className="ml-4 inline-flex h-10 shrink-0 items-center rounded-full bg-brand px-5 text-body font-semibold text-brand-foreground transition-transform active:scale-[0.98]"
        >
          충전
        </button>
      </div>
    </div>
  );
};
