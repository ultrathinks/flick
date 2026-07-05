import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, children, ...props }: Props) {
  const field = (
    <select
      className={cn(
        "h-11 w-full rounded-control border border-border bg-surface px-4 text-heading text-foreground outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );

  if (!label) {
    return field;
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-body font-medium text-foreground-muted">
        {label}
      </span>
      {field}
    </label>
  );
}
