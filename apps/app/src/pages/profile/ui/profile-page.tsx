import { useMe } from "@/entities/user";
import { LogoutButton } from "@/features/logout";
import { Card, Money, Spinner } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

export const ProfilePage = () => {
  const me = useMe();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <PageHeader title="프로필" />
      <div className="space-y-4 px-5 pb-6">
        {me.isPending ? (
          <Card className="flex justify-center py-12">
            <Spinner />
          </Card>
        ) : me.data ? (
          <>
            <Card className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-lg font-bold text-zinc-500">
                {me.data.profileImageUrl ? (
                  <img
                    src={me.data.profileImageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  me.data.name.slice(0, 1)
                )}
              </div>
              <div>
                <p className="text-base font-bold text-zinc-900">
                  {me.data.name}
                </p>
                {me.data.studentNumber && (
                  <p className="text-sm text-zinc-500">
                    {me.data.studentNumber}
                  </p>
                )}
              </div>
            </Card>

            <Card className="flex justify-between">
              <span className="text-sm text-zinc-500">잔액</span>
              <Money
                amount={me.data.balance}
                className="text-sm font-semibold text-zinc-900"
              />
            </Card>
          </>
        ) : (
          <Card className="text-sm text-zinc-500">
            정보를 불러오지 못했어요.
          </Card>
        )}

        <LogoutButton />
      </div>
    </div>
  );
};
