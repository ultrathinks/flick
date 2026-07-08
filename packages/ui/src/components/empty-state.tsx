import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  emoji?: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  emoji,
  icon,
  title,
  description,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      {emoji ? (
        <span aria-hidden className="mb-3 font-emoji text-4xl leading-none">
          {emoji}
        </span>
      ) : icon ? (
        <span className="mb-3 text-foreground-subtle [&>svg]:size-8">
          {icon}
        </span>
      ) : null}
      <p className="text-heading font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-body text-foreground-subtle">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
