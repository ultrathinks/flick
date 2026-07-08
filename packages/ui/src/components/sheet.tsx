"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId } from "react";
import { cn } from "../lib/cn";

export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        className="absolute inset-0 animate-scrim-in bg-scrim"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "relative z-10 flex max-h-[88vh] w-full animate-sheet-in flex-col overflow-hidden rounded-t-sheet border border-border bg-surface shadow-[var(--shadow-overlay)] sm:m-4 sm:max-w-md sm:rounded-sheet",
          className,
        )}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <h2 id={titleId} className="text-heading font-bold text-foreground">
              {title}
            </h2>
            <button
              type="button"
              aria-label="닫기"
              className="flex size-9 items-center justify-center rounded-full text-foreground-subtle outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
              onClick={onClose}
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
