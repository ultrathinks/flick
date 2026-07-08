import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const forbidden = error === "forbidden";

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-5">
      <div className="mb-7 flex flex-col items-center">
        <div className="mb-3 flex size-9 items-center justify-center rounded-card-sm bg-brand text-brand-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <h1 className="text-heading font-semibold tracking-tight text-foreground">
          Flick Admin
        </h1>
        <p className="mt-1 text-body text-foreground-subtle">
          플랫폼 운영 백오피스
        </p>
      </div>

      {forbidden ? (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="text-center text-body text-danger">
            이 계정은 관리자 권한이 없어요. 다른 계정으로 로그인하거나
            관리자에게 문의해 주세요.
          </p>
          <form action="/api/auth/logout" method="post" className="w-full">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center rounded-control bg-surface-muted px-4 text-heading font-semibold text-foreground transition-colors hover:bg-border"
            >
              로그아웃하고 다른 계정으로 로그인
            </button>
          </form>
        </div>
      ) : (
        <Link
          href="/api/auth/login"
          className="flex h-11 w-full items-center justify-center rounded-control bg-brand px-4 text-heading font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          도담 계정으로 로그인
        </Link>
      )}

      {error && !forbidden && (
        <p className="mt-4 text-body text-danger">
          로그인에 실패했어요. 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
}
