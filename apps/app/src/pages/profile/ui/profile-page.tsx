import { ThemeToggle } from "@flick/ui/theme";
import { useMe } from "@/entities/user";
import { LogoutButton } from "@/features/logout";
import {
  Avatar,
  Card,
  EmptyState,
  ListRow,
  Money,
  Screen,
  SectionHeader,
  Spinner,
} from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

export const ProfilePage = () => {
  const me = useMe();

  return (
    <Screen className="flex-1 overflow-y-auto">
      <PageHeader title="프로필" />
      <div className="space-y-6 px-5 pb-6 pt-2">
        {me.isPending ? (
          <Card className="flex justify-center py-12">
            <Spinner />
          </Card>
        ) : me.data ? (
          <>
            <Card className="flex items-center gap-4">
              <Avatar
                name={me.data.name}
                src={me.data.profileImageUrl}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-heading font-bold text-foreground">
                  {me.data.name}
                </p>
                {me.data.studentNumber && (
                  <p className="truncate text-body text-foreground-subtle">
                    {me.data.studentNumber}
                  </p>
                )}
              </div>
            </Card>

            <div>
              <SectionHeader title="설정" />
              <div className="divide-y divide-border rounded-card border border-border bg-surface px-4">
                <ListRow
                  title="잔액"
                  right={
                    <Money
                      amount={me.data.balance}
                      className="text-heading font-semibold text-foreground"
                    />
                  }
                />
                <div className="flex items-center justify-between gap-3 py-3.5">
                  <span className="text-heading font-medium text-foreground">
                    화면 테마
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </>
        ) : (
          <Card>
            <EmptyState
              emoji="😅"
              title="정보를 불러오지 못했어요"
              description="잠시 후 다시 시도해 주세요."
            />
          </Card>
        )}

        <LogoutButton />
      </div>
    </Screen>
  );
};
