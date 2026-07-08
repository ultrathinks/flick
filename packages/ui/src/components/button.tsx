"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "../lib/cn";
import { Loader } from "./loader";

const button = cva(
  "relative inline-flex items-center justify-center gap-1.5 rounded-control font-semibold whitespace-nowrap outline-hidden transition-[color,background-color,border-color,transform] focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        fill: "bg-brand text-brand-foreground hover:bg-brand-hover",
        weak: "bg-brand-subtle text-brand hover:brightness-95",
        neutral: "bg-surface-muted text-foreground hover:bg-border",
        outline:
          "border border-border bg-surface text-foreground hover:bg-surface-muted",
        ghost:
          "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
        danger: "bg-danger text-danger-foreground hover:brightness-95",
      },
      size: {
        sm: "h-9 gap-1 px-3.5 text-body [&_svg]:size-4",
        md: "h-11 px-4 text-heading [&_svg]:size-[18px]",
        lg: "h-[52px] px-5 text-heading [&_svg]:size-5",
        xl: "h-14 px-6 text-subtitle [&_svg]:size-6",
        "icon-sm": "size-9 [&_svg]:size-[18px]",
        icon: "size-11 [&_svg]:size-5",
        "icon-lg": "size-14 [&_svg]:size-6",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "fill", size: "md", block: false },
  },
);

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant,
  size,
  block,
  loading = false,
  className,
  type = "button",
  children,
  disabled,
  ref,
  ...props
}: Props) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(button({ variant, size, block }), className)}
      {...props}
    >
      {loading && (
        <Loader
          size="sm"
          className="absolute border-current/30 border-t-current"
        />
      )}
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>
    </button>
  );
}
