import type { FormEvent } from "react";
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
    <main className="flex min-h-dvh flex-col bg-white">
      <BrandHeader />
      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <form className="w-full max-w-md" onSubmit={onSubmit}>
          <div className="mb-7 text-center">
            <h2 className="text-2xl font-bold text-slate-900">
              키오스크 페어링
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              부스 관리 화면에서 발급된 코드를 입력해주세요
            </p>
          </div>

          {errorMessage ? (
            <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <label
            className="mb-2 block text-sm font-semibold text-slate-700"
            htmlFor="pairing-code"
          >
            페어링 코드
          </label>
          <input
            id="pairing-code"
            className="h-14 w-full rounded-lg border border-slate-200 bg-white px-4 text-center text-xl font-bold tracking-[0.18em] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            placeholder="CODE"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            disabled={isPairing}
          />

          <button
            type="submit"
            className="mt-6 h-14 w-full rounded-lg bg-indigo-600 text-base font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!code.trim() || isPairing}
          >
            {isPairing ? "페어링 중" : "페어링 시작"}
          </button>
        </form>
      </section>
    </main>
  );
}
