"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProductOptions } from "@/entities/option";
import { AuthGate } from "@/features/auth-gate";
import { OptionManager } from "@/widgets/option-manager";

function Options() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const options = useProductOptions(productId);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <header className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-foreground-subtle transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          메뉴로
        </Link>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          옵션 관리
        </h1>
        <p className="mt-0.5 text-sm text-foreground-subtle">
          사이즈, 온도처럼 선택형 옵션과 추가금을 설정하세요.
        </p>
      </header>

      {options.isPending ? (
        <p className="text-sm text-foreground-subtle">불러오는 중…</p>
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
