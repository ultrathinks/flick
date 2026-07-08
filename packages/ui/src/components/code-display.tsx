"use client";

import { Check, Copy } from "lucide-react";
import { cn } from "../lib/cn";
import { useClipboard } from "../lib/use-clipboard";

export function CodeDisplay({
  code,
  size = "md",
  className,
}: {
  code: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const { copied, copy } = useClipboard();

  return (
    <button
      type="button"
      onClick={() => copy(code)}
      aria-label={copied ? "코드 복사됨" : `${code} 코드 복사`}
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-card border border-border bg-surface-muted px-4 outline-hidden transition-colors hover:bg-border focus-visible:ring-2 focus-visible:ring-brand/40",
        size === "lg" ? "py-4" : "py-3",
        className,
      )}
    >
      <span
        className={cn(
          "min-w-0 break-all text-left font-mono font-bold tracking-wider text-foreground",
          size === "lg" ? "text-subtitle" : "text-heading",
        )}
      >
        {code}
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 text-caption font-semibold [&>svg]:size-4",
          copied ? "text-success" : "text-foreground-subtle",
        )}
      >
        {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={1.75} />}
        {copied ? "복사됨" : "복사"}
      </span>
    </button>
  );
}
