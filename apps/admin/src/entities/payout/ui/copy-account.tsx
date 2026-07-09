"use client";

import { useClipboard } from "@flick/ui";
import { Check, Copy } from "lucide-react";
import { cn } from "@/shared/lib/cn.ts";

export function CopyAccount({
  value,
  display,
}: {
  value: string;
  display: string;
}) {
  const { copied, copy } = useClipboard();

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      aria-label={copied ? "복사됨" : "계좌번호 복사"}
      className="group/copy inline-flex items-center gap-1.5 text-foreground outline-hidden"
    >
      <span className="tabular-nums">{display}</span>
      {copied ? (
        <Check aria-hidden className="size-3.5 text-success" strokeWidth={2} />
      ) : (
        <Copy
          aria-hidden
          className={cn(
            "size-3.5 text-foreground-subtle opacity-0 transition-opacity",
            "group-hover/copy:opacity-100 group-focus-visible/copy:opacity-100",
          )}
          strokeWidth={1.75}
        />
      )}
    </button>
  );
}
