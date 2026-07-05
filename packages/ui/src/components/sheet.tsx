"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
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
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-sheet border border-border bg-surface shadow-[var(--shadow-card)] sm:m-4 sm:max-w-md sm:rounded-sheet",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-heading font-bold text-foreground">{title}</h2>
            <button
              type="button"
              aria-label="닫기"
              className="rounded-full p-1 text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
              onClick={onClose}
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
