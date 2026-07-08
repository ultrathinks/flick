"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Me } from "@/shared/auth/me";
import { cn } from "@/shared/lib/cn.ts";
import { NAV_ITEMS, NAV_SECTIONS } from "../model/nav.ts";
import { UserMenu } from "./user-menu.tsx";

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
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-card-sm bg-brand text-brand-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <span className="text-heading font-semibold tracking-tight text-foreground">
            Flick Admin
          </span>
        </div>
        <UserMenu user={user} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <nav className="flex flex-col gap-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section}>
                <p className="mb-1.5 ml-3 text-caption font-medium uppercase tracking-wide text-foreground-subtle">
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
                            "flex items-center gap-3 rounded-card-sm px-3 py-2.5 text-body transition-colors",
                            active
                              ? "bg-surface-muted font-medium text-foreground"
                              : "font-normal text-foreground-subtle hover:bg-surface-muted hover:text-foreground",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-[18px]",
                              active && "text-brand",
                            )}
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

        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
