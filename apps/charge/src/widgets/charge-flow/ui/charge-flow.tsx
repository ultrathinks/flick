import { MAX_CHARGE_AMOUNT } from "@flick/contract";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { useState } from "react";
import {
  type ChargeTransaction,
  createCharge,
  type ResolvedUser,
  resolveUserCode,
} from "@/features/charge";
import { QrScanner } from "@/features/qr-scan";
import { ApiError } from "@/shared/api";
import brandMark from "@/shared/assets/brand-mark.png";
import { useHaptic } from "@/shared/lib";
import {
  Avatar,
  BrandMark,
  Button,
  cn,
  formatWon,
  Icon,
  Input,
  Money,
  NumericKeypad,
  useConfirm,
  useToast,
} from "@/shared/ui";

type Stage =
  | { name: "scan" }
  | { name: "confirm"; user: ResolvedUser; idempotencyKey: string }
  | { name: "done"; user: ResolvedUser; result: ChargeTransaction };

const QUICK_AMOUNTS = [1000, 2000, 3000, 5000];
const LARGE_CHARGE_THRESHOLD = 10000;
const CODE_LENGTH = 6;

interface ChargeFlowProps {
  topInset: number;
  bottomInset: number;
}

export const ChargeFlow = ({ topInset, bottomInset }: ChargeFlowProps) => {
  const [stage, setStage] = useState<Stage>({ name: "scan" });
  const [manualCode, setManualCode] = useState("");
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const haptic = useHaptic();

  const describeError = (err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.status === 404) {
        return "유효하지 않거나 만료된 코드예요.";
      }
      if (err.status === 403) {
        return "충전 권한이 없어요. 관리자 계정인지 확인해 주세요.";
      }
    }
    return "요청을 처리하지 못했어요. 다시 시도해 주세요.";
  };

  const resolve = async (code: string) => {
    const trimmed = code.trim();
    if (busy || trimmed.length === 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user = await resolveUserCode(trimmed);
      haptic("selection");
      setStage({ name: "confirm", user, idempotencyKey: crypto.randomUUID() });
      setManualCode("");
      setAmount(0);
    } catch (err) {
      haptic("error");
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const charge = async () => {
    if (stage.name !== "confirm" || busy) {
      return;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("금액을 입력해 주세요.");
      return;
    }
    if (amount >= LARGE_CHARGE_THRESHOLD) {
      const ok = await confirm({
        title: `${formatWon(amount)}을 충전할까요?`,
        description: `${stage.user.name} 님(학번 ${
          stage.user.studentNumber ?? "미등록"
        })에게 충전해요. 금액이 크니 대상자가 맞는지 확인해 주세요.`,
        confirmLabel: "충전",
      });
      if (!ok) {
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      const result = await createCharge({
        userId: stage.user.userId,
        amount,
        idempotencyKey: stage.idempotencyKey,
      });
      haptic("success");
      setStage({ name: "done", user: stage.user, result });
      toast.success(
        `${stage.user.name} 님에게 ${formatWon(result.amount)}을 충전했어요`,
      );
    } catch (err) {
      haptic("error");
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStage({ name: "scan" });
    setAmount(0);
    setManualCode("");
    setError(null);
  };

  if (stage.name === "scan") {
    return (
      <div className="flex h-full flex-col">
        <header
          className="flex items-center gap-2 px-5 pb-2"
          style={{ paddingTop: topInset + 20 }}
        >
          <BrandMark src={brandMark} className="size-7" />
          <h1 className="text-title font-bold text-foreground">충전</h1>
        </header>

        <div className="flex flex-1 flex-col justify-center gap-6 px-5">
          <div className="text-center">
            <p className="text-heading font-semibold text-foreground">
              학생을 확인하세요
            </p>
            <p className="mt-1 text-body text-foreground-subtle">
              QR을 스캔하거나 6자리 코드를 입력해요
            </p>
          </div>

          <QrScanner onDetect={resolve} />

          <div className="flex items-center gap-3 text-foreground-faint">
            <span className="h-px flex-1 bg-border" />
            <span className="text-caption">또는 코드 입력</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <Input
              placeholder="6자리 코드"
              value={manualCode}
              inputMode="numeric"
              maxLength={CODE_LENGTH}
              className="h-[52px] text-center text-heading tracking-[0.4em] tabular-nums"
              onChange={(event) =>
                setManualCode(
                  event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH),
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void resolve(manualCode);
                }
              }}
            />
            <Button
              block
              size="lg"
              variant="neutral"
              loading={busy}
              disabled={busy || manualCode.trim().length < CODE_LENGTH}
              onClick={() => resolve(manualCode)}
            >
              코드로 확인
            </Button>
          </div>
        </div>

        {error && (
          <p
            className="px-5 pb-2 text-center text-body text-danger"
            style={{ paddingBottom: bottomInset + 16 }}
          >
            {error}
          </p>
        )}
        {!error && <div style={{ height: bottomInset + 12 }} />}
      </div>
    );
  }

  if (stage.name === "confirm") {
    return (
      <div className="flex h-full flex-col">
        <header
          className="flex items-center gap-1 px-3 pb-1"
          style={{ paddingTop: topInset + 10 }}
        >
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            aria-label="뒤로"
            className="inline-flex size-11 items-center justify-center rounded-full text-foreground-subtle transition-colors touch-manipulation active:scale-95 hover:bg-surface-muted disabled:opacity-40"
          >
            <Icon icon={ChevronLeft} size={24} />
          </button>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5">
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name={stage.user.name}
              src={null}
              size="lg"
              className="size-16 text-title"
            />
            <div className="text-center">
              <p className="text-heading font-bold text-foreground">
                {stage.user.name}
              </p>
              <p className="text-caption text-foreground-subtle">
                {stage.user.studentNumber
                  ? `${stage.user.studentNumber} · `
                  : ""}
                잔액 {formatWon(stage.user.balance)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-caption font-medium text-foreground-muted">
              충전 금액
            </span>
            <Money
              amount={amount}
              className={cn(
                "mt-1 text-[2.75rem] leading-tight font-bold tracking-tight",
                amount > 0 ? "text-foreground" : "text-foreground-faint",
              )}
            />
            {error && <p className="mt-1 text-body text-danger">{error}</p>}
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-3">
          {QUICK_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset);
                setError(null);
                haptic("selection");
              }}
              disabled={busy}
              className={cn(
                "h-10 flex-1 rounded-control text-body font-semibold transition-colors touch-manipulation active:scale-[0.97]",
                amount === preset
                  ? "bg-brand-subtle text-brand"
                  : "bg-surface-muted text-foreground-subtle",
              )}
            >
              {formatWon(preset)}
            </button>
          ))}
        </div>

        <div className="px-4 pt-1" style={{ paddingBottom: bottomInset + 16 }}>
          <NumericKeypad
            value={amount}
            onChange={(next) => {
              setAmount(next);
              setError(null);
            }}
            max={MAX_CHARGE_AMOUNT}
            onHaptic={haptic}
          />
          <Button
            block
            size="lg"
            className="mt-3"
            loading={busy}
            disabled={amount <= 0}
            onClick={charge}
          >
            {amount > 0 ? `${formatWon(amount)} 충전` : "충전"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <Icon icon={CheckCircle2} size={72} className="text-brand" />
        <p className="mt-6 text-title font-bold text-foreground">충전 완료</p>
        <p className="mt-2 text-body text-foreground-subtle">
          {stage.user.name} 님에게
        </p>
        <Money
          amount={stage.result.amount}
          className="mt-1 text-[2.75rem] leading-tight font-bold tracking-tight text-foreground"
        />
      </div>
      <div className="px-5" style={{ paddingBottom: bottomInset + 20 }}>
        <Button block size="lg" onClick={reset}>
          다음 학생 충전
        </Button>
      </div>
    </div>
  );
};
