import type { FormEvent } from "react";
import { BrandMark, Button, Input } from "@/shared/ui";

type PairingFormProps = {
  code: string;
  errorMessage: string | null;
  isPairing: boolean;
  onCodeChange: (code: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PairingForm({
  code,
  errorMessage,
  isPairing,
  onCodeChange,
  onSubmit,
}: PairingFormProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <form className="w-full max-w-md" onSubmit={onSubmit}>
        <div className="mb-10 flex flex-col items-center text-center">
          <BrandMark className="size-16" />
          <h1 className="mt-6 text-display font-bold text-foreground">
            키오스크 연결
          </h1>
          <p className="mt-3 text-heading font-medium text-foreground-subtle">
            부스 관리 화면에서 발급된 코드를 입력해주세요
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-card-sm border border-danger/20 bg-danger-subtle px-4 py-3 text-center text-body font-semibold text-danger">
            {errorMessage}
          </div>
        ) : null}

        <label
          className="mb-2 block text-body font-semibold text-foreground-muted"
          htmlFor="pairing-code"
        >
          페어링 코드
        </label>
        <Input
          id="pairing-code"
          className="h-16 text-center text-display font-bold uppercase tracking-[0.4em]"
          value={code}
          onChange={(event) =>
            onCodeChange(event.target.value.toUpperCase().slice(0, 6))
          }
          placeholder="------"
          inputMode="text"
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="one-time-code"
          disabled={isPairing}
        />

        <Button
          type="submit"
          size="xl"
          block
          className="mt-6"
          loading={isPairing}
          disabled={!code.trim()}
        >
          연결하기
        </Button>
      </form>
    </main>
  );
}
