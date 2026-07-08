"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProductOptions } from "@/entities/option";
import { Button, EmptyState, Page, Skeleton } from "@/shared/ui";
import { BoothScreen } from "@/widgets/app-shell";
import { OptionManager } from "@/widgets/option-manager";

function Options() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const options = useProductOptions(productId);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/"
        className="-mx-2 mb-3 inline-flex items-center gap-1 rounded-card-sm px-2 py-2 text-body text-foreground-subtle outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
        메뉴로
      </Link>
      <Page
        title="옵션 관리"
        description="사이즈, 온도처럼 선택형 옵션과 추가금을 설정하세요."
      >
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
              <Button
                variant="weak"
                size="sm"
                onClick={() => options.refetch()}
              >
                다시 시도
              </Button>
            }
          />
        ) : (
          <OptionManager productId={productId} groups={options.data ?? []} />
        )}
      </Page>
    </div>
  );
}

export default function OptionsPage() {
  return <BoothScreen tab="menu">{() => <Options />}</BoothScreen>;
}
