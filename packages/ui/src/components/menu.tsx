"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";

const MenuCloseContext = createContext<() => void>(() => {});

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
    "aria-controls": string;
  }) => ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = () => setOpen(false);

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
        "aria-controls": menuId,
      })}
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-50 max-w-[calc(100vw-2rem)] min-w-52 animate-toast-in overflow-hidden rounded-card border border-border bg-surface p-1.5 shadow-[var(--shadow-overlay)]",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          <MenuCloseContext.Provider value={close}>
            {children}
          </MenuCloseContext.Provider>
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
  const close = useContext(MenuCloseContext);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        close();
        onClick?.();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-card-sm px-3 py-2.5 text-left text-body font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 [&>svg]:size-[18px]",
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
