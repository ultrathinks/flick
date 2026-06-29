import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn.ts";

export function Field({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-foreground">
        {label}
      </span>
      <input
        className={cn(
          "h-9 w-full rounded-[var(--radius-card-sm)] border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20",
          className,
        )}
        {...props}
      />
    </label>
  );
}
