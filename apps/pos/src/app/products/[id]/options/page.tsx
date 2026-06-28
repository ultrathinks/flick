"use client";

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
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 메뉴로
        </Link>
        <h1 className="mt-2 text-xl font-bold">옵션 관리</h1>
        <p className="text-sm text-zinc-500">
          사이즈, 온도처럼 선택형 옵션과 추가금을 설정하세요.
        </p>
      </header>

      {options.isPending ? (
        <p className="text-sm text-zinc-400">불러오는 중…</p>
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
