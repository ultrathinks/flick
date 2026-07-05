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
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      {emoji ? (
        <span
          aria-hidden
          className="text-4xl leading-none"
          style={{ fontFamily: "Tossface" }}
        >
          {emoji}
        </span>
      ) : icon ? (
        <span className="text-foreground-faint [&>svg]:size-8">{icon}</span>
      ) : null}
      <div className="space-y-1">
        <p className="text-heading font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-xs text-body text-foreground-subtle">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
