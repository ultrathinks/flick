import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-between px-1 pb-1", className)}
    >
      <h2 className="text-heading font-bold text-foreground">{title}</h2>
      {action && (
        <div className="text-caption text-foreground-subtle">{action}</div>
      )}
    </div>
  );
}
