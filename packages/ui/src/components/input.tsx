import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: ReactNode;
}

export function Input({ label, error, help, className, ...props }: Props) {
  const field = (
    <input
      aria-invalid={error ? true : undefined}
      className={cn(
        "h-11 w-full rounded-control border bg-surface px-4 text-heading text-foreground outline-none transition-colors placeholder:text-foreground-faint focus:ring-2",
        error
          ? "border-danger focus:border-danger focus:ring-danger/15"
          : "border-border focus:border-brand focus:ring-brand/15",
        className,
      )}
      {...props}
    />
  );

  if (!label && !error && !help) {
    return field;
  }

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-body font-medium text-foreground-muted">
          {label}
        </span>
      )}
      {field}
      {error ? (
        <span className="mt-1 block text-caption text-danger">{error}</span>
      ) : help ? (
        <span className="mt-1 block text-caption text-foreground-subtle">
          {help}
        </span>
      ) : null}
    </label>
  );
}
