import { useRouter } from "@b1nd/aid-kit/navigation";
import { useSafeArea } from "@b1nd/aid-kit/safe-area-provider";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  back?: boolean;
  action?: ReactNode;
}

export const PageHeader = ({
  title,
  back = false,
  action,
}: PageHeaderProps) => {
  const { top } = useSafeArea();
  const { stack } = useRouter();

  return (
    <header
      className={`sticky top-0 ${back ? "bg-bg" : "bg-bg/80 backdrop-blur"}`}
      style={{ paddingTop: top }}
    >
      <div className="flex h-14 items-center gap-1 px-3">
        {back && (
          <button
            type="button"
            onClick={() => stack.pop()}
            className="-ml-1 flex size-10 items-center justify-center rounded-full text-foreground-muted transition-colors active:bg-surface-muted"
            aria-label="뒤로"
          >
            <ChevronLeft className="size-6" strokeWidth={1.75} aria-hidden />
          </button>
        )}
        <h1
          className={`text-subtitle font-bold text-foreground ${back ? "" : "px-2"}`}
        >
          {title}
        </h1>
        {action && <div className="ml-auto">{action}</div>}
      </div>
    </header>
  );
};
