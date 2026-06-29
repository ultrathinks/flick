import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn.ts";

export function Stat({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <p className="text-[13px]">{label}</p>
      </div>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
