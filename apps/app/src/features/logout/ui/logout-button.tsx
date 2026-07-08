import { Button } from "@/shared/ui";
import { useLogout } from "../model/use-logout.ts";

export const LogoutButton = () => {
  const { mutate, isPending } = useLogout();

  return (
    <Button
      variant="ghost"
      size="lg"
      block
      onClick={() => mutate()}
      loading={isPending}
    >
      로그아웃
    </Button>
  );
};
