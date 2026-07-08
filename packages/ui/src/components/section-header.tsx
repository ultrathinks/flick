import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 pb-2", className)}
    >
      <div className="min-w-0">
        <h2 className="truncate text-heading font-bold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 truncate text-caption text-foreground-subtle">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
