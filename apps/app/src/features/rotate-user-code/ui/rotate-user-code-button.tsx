import { Button } from "@/shared/ui";
import { useRotateUserCode } from "../model/use-rotate-user-code.ts";

export const RotateUserCodeButton = () => {
  const { mutate, isPending } = useRotateUserCode();

  return (
    <Button variant="secondary" onClick={() => mutate()} disabled={isPending}>
      {isPending ? "재발급 중..." : "코드 재발급"}
    </Button>
  );
};
