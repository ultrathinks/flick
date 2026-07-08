"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProductOptions } from "@/entities/option";
import { AuthGate } from "@/features/auth-gate";
import { EmptyState, Skeleton } from "@/shared/ui";
import { OptionManager } from "@/widgets/option-manager";

function Options() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const options = useProductOptions(productId);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <header className="mb-6">
        <Link
          href="/"
          className="-mx-2 inline-flex items-center gap-1 px-2 py-2 text-body text-foreground-subtle transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          메뉴로
        </Link>
        <h1 className="mt-2 text-title font-bold tracking-tight text-foreground">
          옵션 관리
        </h1>
        <p className="mt-0.5 text-body text-foreground-subtle">
          사이즈, 온도처럼 선택형 옵션과 추가금을 설정하세요.
        </p>
      </header>

      {options.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : options.isError ? (
        <EmptyState
          emoji="⚠️"
          title="불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={
            <button
              type="button"
              onClick={() => options.refetch()}
              className="rounded-control px-4 py-2 text-body font-semibold text-brand transition-colors hover:bg-brand-subtle"
            >
              다시 시도
            </button>
          }
        />
      ) : (
        <OptionManager productId={productId} groups={options.data ?? []} />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Options />
    </AuthGate>
  );
}
