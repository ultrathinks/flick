import { useRouter } from "@b1nd/aid-kit/navigation";
import { useSafeArea } from "@b1nd/aid-kit/safe-area-provider";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  back?: boolean;
  action?: ReactNode;
}

const BackIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
    <path
      d="M15 5l-7 7 7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PageHeader = ({
  title,
  back = false,
  action,
}: PageHeaderProps) => {
  const { top } = useSafeArea();
  const { stack } = useRouter();

  return (
    <header
      className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur"
      style={{ paddingTop: top }}
    >
      <div className="flex h-14 items-center gap-1 px-3">
        {back && (
          <button
            type="button"
            onClick={() => stack.pop()}
            className="-ml-1 flex size-10 items-center justify-center rounded-full text-zinc-700 active:bg-zinc-200"
            aria-label="뒤로"
          >
            <BackIcon />
          </button>
        )}
        <h1 className={`text-lg font-bold text-zinc-900 ${back ? "" : "px-2"}`}>
          {title}
        </h1>
        {action && <div className="ml-auto">{action}</div>}
      </div>
    </header>
  );
};
