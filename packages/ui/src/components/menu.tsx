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
    triggerProps: {
      "aria-haspopup": "menu";
      "aria-expanded": boolean;
      "aria-controls": string;
    };
  }) => ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = () => setOpen(false);

  const items = () =>
    listRef.current
      ? Array.from(
          listRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]'),
        )
      : [];

  const focusItem = (index: number) => {
    const list = items();
    if (list.length === 0) {
      return;
    }
    const next = (index + list.length) % list.length;
    list[next]?.focus();
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const focusTimer = requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    });
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => {
      cancelAnimationFrame(focusTimer);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const list = items();
    const current = list.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusItem(current + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusItem(current - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(list.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        open,
        toggle: () => setOpen((v) => !v),
        triggerProps: {
          "aria-haspopup": "menu",
          "aria-expanded": open,
          "aria-controls": menuId,
        },
      })}
      {open && (
        <div
          id={menuId}
          ref={listRef}
          role="menu"
          onKeyDown={onKeyDown}
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-(--z-overlay) max-w-[calc(100vw-2rem)] min-w-52 motion-safe:animate-menu-in overflow-hidden rounded-card border border-border bg-surface p-1.5 shadow-[var(--shadow-overlay)]",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          <MenuCloseContext value={close}>{children}</MenuCloseContext>
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
      tabIndex={-1}
      onClick={() => {
        close();
        onClick?.();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-card-sm px-3 py-2.5 text-left text-body font-medium whitespace-nowrap outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 [&>svg]:size-[18px]",
        tone === "danger"
          ? "text-danger hover:bg-danger-subtle focus-visible:bg-danger-subtle"
          : "text-foreground hover:bg-surface-muted focus-visible:bg-surface-muted",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
