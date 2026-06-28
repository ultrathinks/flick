import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-5">
      <h1 className="mb-2 text-2xl font-bold">Flick POS</h1>
      <p className="mb-8 text-sm text-zinc-500">부스 운영자 로그인</p>
      <Link
        href="/api/auth/login"
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
      >
        도담 계정으로 로그인
      </Link>
      {error && (
        <p className="mt-4 text-sm text-red-600">
          로그인에 실패했어요. 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
}
