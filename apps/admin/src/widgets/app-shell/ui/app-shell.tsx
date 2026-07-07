"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Me } from "@/shared/auth/me";
import { cn } from "@/shared/lib/cn.ts";
import { NAV_ITEMS, NAV_SECTIONS } from "../model/nav.ts";

export function AppShell({
  user,
  children,
}: {
  user: Me;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-[var(--radius-card-sm)] bg-brand text-brand-foreground">
            <ShieldCheck className="size-3.5" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            Flick Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-40 truncate text-sm text-foreground-subtle sm:block">
            {user.name}
          </span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-[var(--radius-card-sm)] px-2.5 py-1.5 text-sm text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar px-3 py-4 lg:flex">
          <nav className="flex flex-col gap-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section}>
                <p className="mb-1 ml-2.5 text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
                  {section}
                </p>
                <div className="flex flex-col gap-0.5">
                  {NAV_ITEMS.filter((item) => item.section === section).map(
                    (item) => {
                      const Icon = item.icon;
                      const active = item.match(pathname);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-[var(--radius-card-sm)] px-2.5 py-2 text-sm transition-colors",
                            active
                              ? "bg-surface-muted font-medium text-foreground"
                              : "font-normal text-foreground-subtle hover:bg-surface-muted hover:text-foreground",
                          )}
                        >
                          <Icon
                            className={cn("size-4", active && "text-brand")}
                          />
                          {item.label}
                        </Link>
                      );
                    },
                  )}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
