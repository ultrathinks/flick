import { QRCodeSVG } from "qrcode.react";
import { useUserCode } from "@/entities/user-code";
import { RotateUserCodeButton } from "@/features/rotate-user-code";
import { Card, Screen, Spinner } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

export const MyCodePage = () => {
  const userCode = useUserCode();

  return (
    <Screen className="flex-1 overflow-y-auto">
      <PageHeader title="충전 코드" back />
      <div className="space-y-4 px-5 pb-6">
        <p className="px-1 text-body text-foreground-subtle">
          관리자에게 이 QR 코드를 보여주면 잔액을 충전할 수 있어요.
        </p>

        <Card className="flex flex-col items-center gap-5 py-8">
          {userCode.isPending ? (
            <div className="flex h-52 items-center justify-center">
              <Spinner />
            </div>
          ) : userCode.data ? (
            <>
              <div className="rounded-2xl bg-white p-4">
                <QRCodeSVG
                  value={userCode.data.code}
                  size={200}
                  level="M"
                  marginSize={0}
                  bgColor="#ffffff"
                  fgColor="#191f28"
                />
              </div>
              <p className="break-all text-center font-mono text-body font-semibold tracking-widest text-foreground-subtle">
                {userCode.data.code}
              </p>
            </>
          ) : (
            <p className="text-body text-foreground-subtle">
              코드를 불러오지 못했어요.
            </p>
          )}
        </Card>

        <RotateUserCodeButton />
      </div>
    </Screen>
  );
};
