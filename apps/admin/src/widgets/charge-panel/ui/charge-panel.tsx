"use client";

import { useState } from "react";
import {
  type ChargeTransaction,
  createCharge,
  type ResolvedUser,
  resolveUserCode,
} from "@/features/charge";
import { ApiError } from "@/shared/api";
import { Button, formatWon, Input } from "@/shared/ui";
import { QrScanner } from "./qr-scanner.tsx";

type Stage =
  | { name: "scan" }
  | { name: "confirm"; user: ResolvedUser; idempotencyKey: string }
  | { name: "done"; user: ResolvedUser; result: ChargeTransaction };

export function ChargePanel() {
  const [stage, setStage] = useState<Stage>({ name: "scan" });
  const [manualCode, setManualCode] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              placeholder="코드 직접 입력"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
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
        <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
          <div>
            <p className="text-body font-semibold text-foreground">
              {stage.user.name}
            </p>
            <p className="text-caption text-foreground-subtle">
              현재 잔액 {formatWon(stage.user.balance)}
              {stage.user.studentNumber ? ` · ${stage.user.studentNumber}` : ""}
            </p>
          </div>
          <Input
            label="충전 금액"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" block onClick={reset} disabled={busy}>
              취소
            </Button>
            <Button block onClick={charge} disabled={busy}>
              충전
            </Button>
          </div>
        </div>
      )}

      {stage.name === "done" && (
        <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-surface p-6 text-center">
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
        </div>
      )}

      {error && <p className="text-center text-caption text-danger">{error}</p>}
    </div>
  );
}
