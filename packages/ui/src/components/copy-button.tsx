"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";

export function CopyButton({
  value,
  label = "복사",
  className,
  onCopied,
}: {
  value: string;
  label?: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-body font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 [&>svg]:size-4",
        copied
          ? "bg-success-subtle text-success"
          : "bg-surface-muted text-foreground-muted hover:bg-border hover:text-foreground",
        className,
      )}
    >
      {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={1.75} />}
      {copied ? "복사됨" : label}
    </button>
  );
}
