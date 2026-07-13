import type { ReactNode } from "react";
import { Button, EmptyState, Screen, Spinner } from "@/shared/ui";
import { useAuthGate } from "../model/use-auth-gate.ts";

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { status, retry } = useAuthGate();

  if (status === "authenticated") {
    return <>{children}</>;
  }

  if (status === "checking") {
    return (
      <Screen className="items-center justify-center">
        <Spinner className="size-8" />
      </Screen>
    );
  }

  const isError = status === "error";
  return (
    <Screen className="items-center justify-center">
      <EmptyState
        emoji={isError ? "⚠️" : "🔒"}
        title={isError ? "다시 열어주세요" : "로그인이 필요해요"}
        description={
          isError
            ? "세션이 만료됐어요. 도담 앱에서 플릭을 다시 열어주세요."
            : "도담 앱에서 플릭을 다시 열어주세요."
        }
        action={
          <Button size="lg" onClick={retry}>
            다시 시도
          </Button>
        }
      />
    </Screen>
  );
};
