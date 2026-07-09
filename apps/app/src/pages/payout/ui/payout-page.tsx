import { usePayout } from "@/entities/payout";
import { PayoutAccountForm } from "@/features/payout-account";
import {
  Button,
  Card,
  Money,
  Screen,
  Skeleton,
  useToast,
} from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

export const PayoutPage = () => {
  const payout = usePayout();
  const toast = useToast();

  return (
    <Screen className="flex-1 overflow-y-auto">
      <PageHeader title="환급 계좌" back />
      <div className="mx-auto w-full max-w-md space-y-6 px-5 pb-10 pt-2">
        <p className="text-body text-foreground-subtle">
          축제가 끝난 뒤 남은 잔액을 돌려받을 계좌예요. 미리 등록해 두면 환급이
          빨라져요.
        </p>

        {payout.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-card" />
            <Skeleton className="h-40 rounded-card" />
          </div>
        ) : payout.isError || !payout.data ? (
          <Card className="flex items-center justify-between gap-3">
            <span className="text-body text-foreground-subtle">
              정보를 불러오지 못했어요.
            </span>
            <Button variant="ghost" size="sm" onClick={() => payout.refetch()}>
              다시 시도
            </Button>
          </Card>
        ) : (
          <>
            <Card className="flex flex-col gap-1.5 bg-brand-subtle">
              <span className="text-caption font-medium text-foreground-subtle">
                환급 예정 금액
              </span>
              <Money
                amount={payout.data.availableAmount}
                className="text-title font-bold text-foreground"
              />
              <span className="text-caption text-foreground-subtle">
                기본 지원금을 제외한 충전·잔여 금액이에요.
              </span>
            </Card>

            <Card className="space-y-4">
              <h2 className="text-heading font-bold text-foreground">
                {payout.data.account ? "등록된 계좌" : "계좌 등록"}
              </h2>
              <PayoutAccountForm
                account={payout.data.account}
                onSaved={() =>
                  toast.success(
                    payout.data?.account
                      ? "환급 계좌를 변경했어요"
                      : "환급 계좌를 등록했어요",
                  )
                }
              />
            </Card>
          </>
        )}
      </div>
    </Screen>
  );
};
