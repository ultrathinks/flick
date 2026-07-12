"use client";

import { MAX_CHARGE_AMOUNT } from "@flick/contract";
import { useState } from "react";
import {
  type ChargeTransaction,
  createCharge,
  type ResolvedUser,
  resolveUserCode,
} from "@/features/charge";
import { ApiError } from "@/shared/api";
import {
  Button,
  Card,
  formatWon,
  Input,
  useConfirm,
  useToast,
} from "@/shared/ui";
import { QrScanner } from "./qr-scanner.tsx";

type Stage =
  | { name: "scan" }
  | { name: "confirm"; user: ResolvedUser; idempotencyKey: string }
  | { name: "done"; user: ResolvedUser; result: ChargeTransaction };

const QUICK_AMOUNTS = [5000, 10000, 30000, 50000];
const LARGE_CHARGE_THRESHOLD = 50000;

export function ChargePanel() {
  const [stage, setStage] = useState<Stage>({ name: "scan" });
  const [manualCode, setManualCode] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  function setAmountCapped(next: string) {
    const digits = next.replace(/\D/g, "");
    if (digits === "") {
      setAmount("");
      return;
    }
    const clamped = Math.min(Number(digits), MAX_CHARGE_AMOUNT);
    setAmount(String(clamped));
  }

  async function resolve(code: string) {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user = await resolveUserCode(code);
      setStage({ name: "confirm", user, idempotencyKey: crypto.randomUUID() });
      setManualCode("");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "유효하지 않거나 만료된 코드예요."
          : "코드를 확인하지 못했어요.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function charge() {
    if (stage.name !== "confirm" || busy) {
      return;
    }
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError("올바른 금액을 입력해 주세요.");
      return;
    }
    if (value > MAX_CHARGE_AMOUNT) {
      setError(`한 번에 ${formatWon(MAX_CHARGE_AMOUNT)}까지 충전할 수 있어요.`);
      return;
    }
    if (value >= LARGE_CHARGE_THRESHOLD) {
      const ok = await confirm({
        title: `${formatWon(value)}을 충전할까요?`,
        description: `${stage.user.name} 님(학번 ${
          stage.user.studentNumber ?? "미등록"
        })에게 충전해요. 큰 금액이니 대상자가 맞는지 확인해 주세요.`,
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
        amount: value,
        idempotencyKey: stage.idempotencyKey,
      });
      setStage({ name: "done", user: stage.user, result });
      setAmount("");
      toast.success(
        `${stage.user.name} 님에게 ${formatWon(result.amount)}을 충전했어요`,
      );
    } catch {
      setError("충전에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStage({ name: "scan" });
    setAmount("");
    setError(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      {stage.name === "scan" && (
        <>
          <QrScanner onScan={resolve} />
          <p className="text-center text-caption text-foreground-subtle">
            사용자의 QR 코드를 비추거나 코드를 직접 입력하세요.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="6자리 코드 입력"
              value={manualCode}
              inputMode="numeric"
              maxLength={6}
              className="text-center tracking-[0.3em] tabular-nums"
              onChange={(event) =>
                setManualCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <Button
              variant="outline"
              onClick={() => resolve(manualCode.trim())}
              disabled={busy || manualCode.trim().length === 0}
            >
              확인
            </Button>
          </div>
        </>
      )}

      {stage.name === "confirm" && (
        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-body font-semibold text-foreground">
              {stage.user.name}
            </p>
            <p className="text-caption text-foreground-subtle">
              현재 잔액 {formatWon(stage.user.balance)}
              {stage.user.studentNumber ? ` · ${stage.user.studentNumber}` : ""}
            </p>
          </div>
          <div>
            <Input
              label="충전 금액"
              type="number"
              inputMode="numeric"
              placeholder="0"
              max={MAX_CHARGE_AMOUNT}
              value={amount}
              onChange={(event) => setAmountCapped(event.target.value)}
              error={error ?? undefined}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant="neutral"
                  size="sm"
                  onClick={() => setAmount(String(preset))}
                  disabled={busy}
                >
                  {formatWon(preset)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" block onClick={reset} disabled={busy}>
              취소
            </Button>
            <Button block onClick={charge} loading={busy}>
              충전
            </Button>
          </div>
        </Card>
      )}

      {stage.name === "done" && (
        <Card className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-heading font-semibold text-foreground">
            충전 완료
          </p>
          <p className="text-body text-foreground-subtle">
            {stage.user.name} 님에게 {formatWon(stage.result.amount)}을
            충전했어요.
          </p>
          <Button block onClick={reset}>
            다음 사용자 충전
          </Button>
        </Card>
      )}

      {stage.name === "scan" && error && (
        <p className="text-center text-caption text-danger">{error}</p>
      )}
    </div>
  );
}
