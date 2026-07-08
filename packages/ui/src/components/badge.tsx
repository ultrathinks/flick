import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";
type Variant = "weak" | "fill";

const weak: Record<Tone, string> = {
  neutral: "bg-surface-muted text-foreground-muted",
  brand: "bg-brand-subtle text-brand",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
};

const fill: Record<Tone, string> = {
  neutral: "bg-foreground-muted text-surface",
  brand: "bg-brand text-brand-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
};

export function Badge({
  tone = "neutral",
  variant = "weak",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold leading-none [&>svg]:size-3.5",
        (variant === "fill" ? fill : weak)[tone],
        className,
      )}
      {...props}
    />
  );
}
