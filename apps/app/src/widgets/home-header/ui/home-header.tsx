import { useRouter } from "@b1nd/aid-kit/navigation";
import { useSafeArea } from "@b1nd/aid-kit/safe-area-provider";
import { CreditCard, Landmark, MoreHorizontal } from "lucide-react";
import { Menu, MenuItem } from "@/shared/ui";

export const HomeHeader = () => {
  const { top } = useSafeArea();
  const { stack } = useRouter();

  return (
    <header
      className="sticky top-0 bg-bg/80 backdrop-blur-sm"
      style={{ paddingTop: top }}
    >
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-5">
        <span className="text-subtitle font-extrabold tracking-tight text-foreground">
          Flick
        </span>
        <Menu
          trigger={({ toggle, triggerProps }) => (
            <button
              type="button"
              onClick={toggle}
              aria-label="더보기"
              className="-mr-2 flex size-11 items-center justify-center rounded-full text-foreground-muted transition-colors active:bg-surface-muted"
              {...triggerProps}
            >
              <MoreHorizontal
                className="size-6"
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
          )}
        >
          <MenuItem
            icon={<CreditCard aria-hidden />}
            onClick={() => stack.push("/cards")}
          >
            카드
          </MenuItem>
          <MenuItem
            icon={<Landmark aria-hidden />}
            onClick={() => stack.push("/payout")}
          >
            환급 계좌
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
};
