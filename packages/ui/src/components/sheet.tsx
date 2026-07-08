"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) {
        return;
      }
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const focusTimer = requestAnimationFrame(() => {
      const target =
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        panelRef.current;
      target?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(focusTimer);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-(--z-overlay) flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        className="absolute inset-0 animate-scrim-in bg-scrim"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[88vh] w-full motion-safe:animate-sheet-in flex-col overflow-hidden rounded-t-sheet border border-border bg-surface shadow-[var(--shadow-overlay)] outline-hidden sm:m-4 sm:max-w-md sm:rounded-sheet",
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
              className="flex size-9 items-center justify-center rounded-full text-foreground-subtle outline-hidden transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
              onClick={onClose}
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
