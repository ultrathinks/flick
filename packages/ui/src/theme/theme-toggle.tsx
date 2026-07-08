"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../lib/cn";
import { type Theme, useTheme } from "./theme-provider";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "system", label: "시스템", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex rounded-control bg-surface-muted p-1",
        className,
      )}
      role="radiogroup"
      aria-label="화면 테마"
    >
      {options.map((option) => {
        const active = theme === option.value;
        const IconComponent = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex size-9 items-center justify-center rounded-[calc(var(--radius-control)-0.25rem)] transition-colors [&>svg]:size-[18px]",
              active
                ? "bg-surface text-brand"
                : "text-foreground-subtle hover:text-foreground",
            )}
          >
            <IconComponent strokeWidth={1.75} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
