import { cn } from "@/shared/lib/cn.ts";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-card-sm)] bg-surface-muted",
        className,
      )}
    />
  );
}
