import { useUserCode } from "@/entities/user-code";
import { RotateUserCodeButton } from "@/features/rotate-user-code";
import { Card, Spinner } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

export const MyCodePage = () => {
  const userCode = useUserCode();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-zinc-50">
      <PageHeader title="충전 코드" back />
      <div className="space-y-4 px-5 pb-6">
        <p className="px-1 text-sm text-zinc-500">
          관리자에게 이 코드를 보여주면 잔액을 충전할 수 있어요.
        </p>

        <Card className="flex flex-col items-center gap-4 py-10">
          {userCode.isPending ? (
            <Spinner />
          ) : userCode.data ? (
            <p className="break-all text-center font-mono text-xl font-bold tracking-wider text-zinc-900">
              {userCode.data.code}
            </p>
          ) : (
            <p className="text-sm text-zinc-500">코드를 불러오지 못했어요.</p>
          )}
        </Card>

        <RotateUserCodeButton />
      </div>
    </div>
  );
};
