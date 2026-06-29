import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn.ts";

const button = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-card-sm)] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-on-brand hover:bg-brand-strong disabled:opacity-50",
        secondary:
          "bg-surface-muted text-foreground hover:bg-border disabled:opacity-50",
        outline:
          "border border-border bg-surface text-foreground hover:bg-surface-muted disabled:opacity-50",
        danger:
          "bg-danger-soft text-danger hover:brightness-95 disabled:opacity-50",
        ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(button({ variant, size }), className)}
      {...props}
    />
  );
}
