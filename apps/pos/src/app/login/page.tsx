import { Store } from "lucide-react";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-5">
      <div className="mb-7 flex flex-col items-center">
        <div className="mb-3 flex size-9 items-center justify-center rounded-card-sm bg-brand text-brand-foreground">
          <Store className="size-5" />
        </div>
        <h1 className="text-subtitle font-semibold tracking-tight text-foreground">
          Flick POS
        </h1>
        <p className="mt-1 text-body text-foreground-subtle">
          부스 운영자 로그인
        </p>
      </div>
      <Link
        href="/api/auth/login"
        className="flex h-11 w-full items-center justify-center rounded-control bg-brand px-4 text-heading font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
      >
        도담 계정으로 로그인
      </Link>
      {error && (
        <p className="mt-4 text-body text-danger">
          로그인에 실패했어요. 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
}
