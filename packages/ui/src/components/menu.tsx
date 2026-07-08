"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { cn } from "../lib/cn";

export function Menu({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
  }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        open,
        toggle: () => setOpen((v) => !v),
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })}
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-50 min-w-52 animate-toast-in overflow-hidden rounded-card border border-border bg-surface p-1.5 shadow-[var(--shadow-overlay)]",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onClick,
  tone = "neutral",
  icon,
  children,
}: {
  onClick?: () => void;
  tone?: "neutral" | "danger";
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-card-sm px-3 py-2.5 text-left text-body font-medium transition-colors [&>svg]:size-[18px]",
        tone === "danger"
          ? "text-danger hover:bg-danger-subtle"
          : "text-foreground hover:bg-surface-muted",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
