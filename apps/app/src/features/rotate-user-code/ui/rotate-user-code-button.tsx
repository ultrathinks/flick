import { Button } from "@/shared/ui";
import { useRotateUserCode } from "../model/use-rotate-user-code.ts";

export const RotateUserCodeButton = () => {
  const { mutate, isPending } = useRotateUserCode();

  return (
    <Button
      variant="neutral"
      size="lg"
      block
      onClick={() => mutate()}
      disabled={isPending}
      loading={isPending}
    >
      코드 재발급
    </Button>
  );
};
