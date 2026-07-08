import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({
  className,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-5",
        hover && "transition-colors hover:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}
