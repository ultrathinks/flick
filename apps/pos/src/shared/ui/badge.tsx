import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn.ts";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-border text-muted",
  brand: "border-brand/20 text-brand",
  success: "border-success/20 text-success",
  warning: "border-warning/20 text-warning",
  danger: "border-danger/20 text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium [&>svg]:size-3",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
