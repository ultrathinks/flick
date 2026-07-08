"use client";

import { Button } from "@/shared/ui";

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <h1 className="text-title font-bold text-foreground">
        오류가 발생했어요
      </h1>
      <p className="mt-3 text-heading font-medium text-foreground-subtle">
        {error.message || "요청을 처리하는 중 문제가 생겼어요"}
      </p>
      <Button size="lg" className="mt-8" onClick={reset}>
        다시 시도
      </Button>
    </main>
  );
}
