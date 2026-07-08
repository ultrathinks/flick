import type { ReactNode } from "react";
import { cn } from "./cn";

export function fieldClass(
  hasError: boolean,
  ...extra: (string | undefined)[]
): string {
  return cn(
    "w-full rounded-control border bg-surface px-4 text-heading text-foreground outline-none transition-colors placeholder:text-foreground-faint focus:ring-2",
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/15"
      : "border-border focus:border-brand focus:ring-brand/15",
    ...extra,
  );
}

export function FieldShell({
  label,
  error,
  help,
  children,
}: {
  label?: string;
  error?: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  if (!label && !error && !help) {
    return <>{children}</>;
  }

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-body font-medium text-foreground-muted">
          {label}
        </span>
      )}
      {children}
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
