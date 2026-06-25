import { useRouter } from "@b1nd/aid-kit/navigation";
import { useSafeArea } from "@b1nd/aid-kit/safe-area-provider";

interface TabItem {
  path: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const HomeIcon = (active: boolean) => (
  <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
    <path
      d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const PayIcon = (active: boolean) => (
  <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ListIcon = (active: boolean) => (
  <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
    <path
      d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"
      stroke="currentColor"
      strokeWidth={active ? "2.4" : "1.8"}
      strokeLinecap="round"
    />
  </svg>
);

const ProfileIcon = (active: boolean) => (
  <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
    <circle
      cx="12"
      cy="8"
      r="4"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const tabs: TabItem[] = [
  { path: "/", label: "홈", icon: HomeIcon },
  { path: "/pay", label: "결제", icon: PayIcon },
  { path: "/transactions", label: "내역", icon: ListIcon },
  { path: "/profile", label: "프로필", icon: ProfileIcon },
];

export const BottomTabBar = () => {
  const { tab } = useRouter();
  const { bottom } = useSafeArea();

  return (
    <nav
      className="sticky bottom-0 z-10 flex border-t border-zinc-100 bg-white/95 backdrop-blur"
      style={{ paddingBottom: bottom }}
    >
      {tabs.map((item) => {
        const active = tab.current === item.path;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => tab.move(item.path)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              active ? "text-blue-600" : "text-zinc-400"
            }`}
          >
            {item.icon(active)}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
