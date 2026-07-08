import { useRouter } from "@b1nd/aid-kit/navigation";
import { useSafeArea } from "@b1nd/aid-kit/safe-area-provider";
import { Home, type LucideIcon, QrCode, Receipt, User } from "lucide-react";

interface TabItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const tabs: TabItem[] = [
  { path: "/", label: "홈", icon: Home },
  { path: "/pay", label: "결제", icon: QrCode },
  { path: "/transactions", label: "내역", icon: Receipt },
  { path: "/profile", label: "프로필", icon: User },
];

export const BottomTabBar = () => {
  const { tab, stack } = useRouter();
  const { bottom } = useSafeArea();

  if (stack.current.length > 0) {
    return null;
  }

  return (
    <nav
      className="sticky bottom-0 z-10 flex border-t border-border bg-surface"
      style={{ paddingBottom: bottom }}
    >
      {tabs.map((item) => {
        const active = tab.current === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => tab.move(item.path)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-caption font-medium transition-colors ${
              active ? "text-brand" : "text-foreground-subtle"
            }`}
          >
            <Icon
              className="size-6"
              strokeWidth={active ? 2.2 : 1.75}
              aria-hidden
            />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
