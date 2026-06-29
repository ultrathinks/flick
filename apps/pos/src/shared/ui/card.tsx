import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn.ts";

export function Card({
  className,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-surface p-4",
        hover && "transition-colors hover:border-muted/40",
        className,
      )}
      {...props}
    />
  );
}
