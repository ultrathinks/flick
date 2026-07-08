"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn.ts";
import { NAV_ITEMS, NAV_SECTIONS } from "../model/nav.ts";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
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
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-card-sm px-3 py-2.5 text-body transition-colors",
                      active
                        ? "bg-surface-muted font-medium text-foreground"
                        : "font-normal text-foreground-subtle hover:bg-surface-muted hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn("size-[18px]", active && "text-brand")}
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
  );
}
