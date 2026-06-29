import type { SelectHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn.ts";

export function Select({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const select = (
    <select
      className={cn(
        "h-9 w-full rounded-[var(--radius-card-sm)] border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
  if (!label) {
    return select;
  }
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-foreground">
        {label}
      </span>
      {select}
    </label>
  );
}
