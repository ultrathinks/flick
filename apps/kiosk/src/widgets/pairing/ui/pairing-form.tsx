import type { FormEvent } from "react";
import { Button, Input } from "@/shared/ui";
import { BrandHeader } from "@/shared/ui/brand-header";

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
    <main className="flex min-h-dvh flex-col bg-bg">
      <BrandHeader />
      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <form className="w-full max-w-md" onSubmit={onSubmit}>
          <div className="mb-8 text-center">
            <h2 className="text-display font-bold text-foreground">
              키오스크 페어링
            </h2>
            <p className="mt-3 text-heading font-medium text-foreground-subtle">
              부스 관리 화면에서 발급된 코드를 입력해주세요
            </p>
          </div>

          {errorMessage ? (
            <div className="mb-5 rounded-card-sm border border-danger/20 bg-danger-subtle px-4 py-3 text-body font-semibold text-danger">
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
            className="h-14 text-center text-subtitle font-bold tracking-[0.18em]"
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            placeholder="CODE"
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
            페어링 시작
          </Button>
        </form>
      </section>
    </main>
  );
}
