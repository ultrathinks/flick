"use client";

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
      <h1 className="text-2xl font-bold text-slate-900">오류가 발생했습니다</h1>
      <p className="mt-2 text-sm font-medium text-slate-500">
        {error.message || "요청을 처리하는 중 문제가 발생했습니다"}
      </p>
      <button
        type="button"
        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-base font-bold text-white transition hover:bg-indigo-500"
        onClick={reset}
      >
        다시 시도
      </button>
    </main>
  );
}
