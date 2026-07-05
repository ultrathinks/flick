import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Card({
  className,
  flat = false,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { flat?: boolean; hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-5",
        !flat && "shadow-[var(--shadow-card)]",
        hover && "transition-colors hover:border-border-strong",
        className,
      )}
      {...props}
    />
  );
}
