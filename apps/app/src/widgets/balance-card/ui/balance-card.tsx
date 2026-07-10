import { useRouter } from "@b1nd/aid-kit/navigation";
import { RollingNumber } from "@flick/ui";
import {
  CardVisual,
  getCardTheme,
  useSelectedCardThemeId,
} from "@/entities/card";
import { usePayByCode } from "@/features/pay-by-code";

interface BalanceCardProps {
  balance: number;
}

export const BalanceCard = ({ balance }: BalanceCardProps) => {
  const { stack } = useRouter();
  const { scan, enterCode } = usePayByCode();
  const selectedId = useSelectedCardThemeId();
  const theme = getCardTheme(selectedId);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={scan}
        aria-label="QR 스캔하여 결제하기"
        className="block w-full transition-transform active:scale-[0.98]"
      >
        <CardVisual theme={theme} />
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

      <button
        type="button"
        onClick={enterCode}
        className="w-full text-center text-body font-medium text-foreground-subtle underline-offset-4 transition-colors hover:text-foreground"
      >
        QR 스캔이 어렵나요? 결제 코드 입력하기
      </button>
    </div>
  );
};
