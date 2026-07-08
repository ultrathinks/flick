"use client";

import { Lock, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Booth } from "@/entities/booth";
import { cn } from "@/shared/lib/cn.ts";
import { isTabLocked, TABS, type TabDef, type TabKey } from "../model/tabs.ts";
import { BoothMenu } from "./booth-menu.tsx";

function activeTab(pathname: string): TabKey {
  if (pathname.startsWith("/orders")) {
    return "orders";
  }
  if (pathname.startsWith("/kiosks")) {
    return "kiosks";
  }
  if (pathname.startsWith("/settings")) {
    return "settings";
  }
  return "menu";
}

const SECTIONS = [...new Set(TABS.map((tab) => tab.section))];

export function AppShell({
  booth,
  children,
}: {
  booth: Booth;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const current = activeTab(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-card-sm bg-brand text-brand-foreground">
            <Store className="size-4" />
          </span>
          <span className="text-heading font-semibold tracking-tight text-foreground">
            Flick POS
          </span>
        </div>
        <BoothMenu booth={booth} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <nav className="flex flex-col gap-6">
            {SECTIONS.map((section) => (
              <div key={section}>
                <p className="mb-1.5 ml-3 text-caption font-medium uppercase tracking-wide text-foreground-subtle">
                  {section}
                </p>
                <div className="flex flex-col gap-0.5">
                  {TABS.filter((tab) => tab.section === section).map((tab) => (
                    <SidebarItem
                      key={tab.key}
                      tab={tab}
                      active={current === tab.key}
                      locked={isTabLocked(tab.key, booth.status)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface lg:hidden">
        {TABS.map((tab) => {
          const locked = isTabLocked(tab.key, booth.status);
          const isActive = current === tab.key;
          const Icon = tab.icon;
          if (locked) {
            return (
              <span
                key={tab.key}
                className="flex flex-1 cursor-not-allowed flex-col items-center gap-0.5 py-3 text-caption font-medium text-foreground-subtle opacity-40"
              >
                <Icon className="size-5" />
                {tab.shortLabel}
              </span>
            );
          }
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-3 text-caption font-medium transition-colors",
                isActive ? "text-brand" : "text-foreground-subtle",
              )}
            >
              <Icon className="size-5" />
              {tab.shortLabel}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarItem({
  tab,
  active,
  locked,
}: {
  tab: TabDef;
  active: boolean;
  locked: boolean;
}) {
  const Icon = tab.icon;
  if (locked) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-3 rounded-card-sm px-3 py-2.5 text-body font-medium text-foreground-subtle opacity-50"
        title="승인 후 이용할 수 있어요"
      >
        <Icon className="size-[18px]" />
        {tab.label}
        <Lock className="ml-auto size-3.5" />
      </span>
    );
  }
  return (
    <Link
      href={tab.href}
      className={cn(
        "flex items-center gap-3 rounded-card-sm px-3 py-2.5 text-body transition-colors",
        active
          ? "bg-surface-muted font-medium text-foreground"
          : "font-normal text-foreground-subtle hover:bg-surface-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("size-[18px]", active && "text-brand")} />
      {tab.label}
    </Link>
  );
}
