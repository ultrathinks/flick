import type { ReactNode } from "react";
import { Button, Screen, Spinner } from "@/shared/ui";
import { useAuthGate } from "../model/use-auth-gate.ts";

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { status, retry } = useAuthGate();

  if (status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <Screen className="items-center justify-center gap-6 px-8 text-center">
      {status === "checking" ? (
        <Spinner className="size-8" />
      ) : (
        <>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-zinc-900">
              로그인이 필요해요
            </h1>
            <p className="text-sm text-zinc-500">
              도담 앱에서 다시 열어 주세요.
            </p>
          </div>
          <Button fullWidth={false} onClick={retry}>
            다시 시도
          </Button>
        </>
      )}
    </Screen>
  );
};
