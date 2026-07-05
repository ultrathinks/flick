import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function Stat({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-foreground-subtle [&>svg]:size-4">
        {icon}
        <p className="text-caption">{label}</p>
      </div>
      <p className="mt-1.5 text-subtitle font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-caption text-foreground-subtle">{hint}</p>
      )}
    </div>
  );
}
