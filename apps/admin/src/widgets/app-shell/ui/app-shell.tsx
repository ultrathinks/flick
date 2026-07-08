"use client";

import { Menu as MenuIcon, ShieldCheck, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Me } from "@/shared/auth/me";
import { SidebarNav } from "./sidebar-nav.tsx";
import { UserMenu } from "./user-menu.tsx";

export function AppShell({
  user,
  children,
}: {
  user: Me;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setDrawerOpen(true)}
            className="flex size-9 items-center justify-center rounded-card-sm text-foreground-muted outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 lg:hidden"
          >
            <MenuIcon className="size-5" strokeWidth={1.75} />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-card-sm bg-brand text-brand-foreground">
              <ShieldCheck className="size-4" />
            </span>
            <span className="text-heading font-semibold tracking-tight text-foreground">
              Flick Admin
            </span>
          </div>
        </div>
        <UserMenu user={user} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <SidebarNav />
        </aside>

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            tabIndex={-1}
            className="absolute inset-0 animate-scrim-in bg-scrim"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col border-r border-border bg-sidebar shadow-[var(--shadow-overlay)]">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="text-heading font-semibold tracking-tight text-foreground">
                Flick Admin
              </span>
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setDrawerOpen(false)}
                className="flex size-9 items-center justify-center rounded-full text-foreground-subtle outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
