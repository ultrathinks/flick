"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  left?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  withArrow?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListRow({
  left,
  title,
  description,
  right,
  withArrow,
  onClick,
  className,
}: Props) {
  const inner = (
    <>
      {left && <span className="flex shrink-0 items-center">{left}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-heading font-medium text-foreground">
          {title}
        </span>
        {description && (
          <span className="truncate text-caption text-foreground-subtle">
            {description}
          </span>
        )}
      </span>
      {(right || withArrow) && (
        <span className="flex shrink-0 items-center gap-1">
          {right && (
            <span className="flex items-center text-body text-foreground-muted">
              {right}
            </span>
          )}
          {withArrow && (
            <ChevronRight
              aria-hidden
              strokeWidth={1.75}
              className="size-5 shrink-0 text-foreground-subtle"
            />
          )}
        </span>
      )}
    </>
  );

  const base = "flex items-center gap-3 py-3.5 text-left";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          base,
          "-mx-2 w-[calc(100%+1rem)] rounded-card-sm px-2 outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand/40 active:bg-surface-muted",
          className,
        )}
      >
        {inner}
      </button>
    );
  }

  return <div className={cn(base, "w-full", className)}>{inner}</div>;
}
