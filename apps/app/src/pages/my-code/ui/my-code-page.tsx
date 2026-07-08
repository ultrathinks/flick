import { QRCodeSVG } from "qrcode.react";
import { useUserCode } from "@/entities/user-code";
import { Button, Card, CodeDisplay, Screen, Spinner } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

export const MyCodePage = () => {
  const userCode = useUserCode();

  return (
    <Screen className="flex-1 overflow-y-auto">
      <PageHeader title="충전 코드" back />
      <div className="space-y-6 px-5 pb-6 pt-2">
        <p className="text-body text-foreground-subtle">
          관리자에게 이 QR 코드를 보여주면 잔액을 충전할 수 있어요.
        </p>

        {userCode.isPending ? (
          <Card className="flex h-72 items-center justify-center">
            <Spinner />
          </Card>
        ) : userCode.isError || !userCode.data ? (
          <Card className="flex h-72 flex-col items-center justify-center gap-3 text-center">
            <p className="text-body text-foreground-subtle">
              코드를 불러오지 못했어요.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => userCode.refetch()}
            >
              다시 시도
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            <Card className="flex flex-col items-center gap-5 py-8">
              <div className="rounded-card bg-white p-4">
                <QRCodeSVG
                  value={userCode.data.code}
                  size={200}
                  level="M"
                  marginSize={0}
                  bgColor="#ffffff"
                  fgColor="#191f28"
                />
              </div>
            </Card>
            <CodeDisplay code={userCode.data.code} />
          </div>
        )}
      </div>
    </Screen>
  );
};
