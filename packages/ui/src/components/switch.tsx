import { cva, type VariantProps } from "class-variance-authority";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../lib/cn";

const track = cva(
  "relative inline-flex shrink-0 items-center rounded-full bg-border transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-disabled:opacity-40 after:absolute after:rounded-full after:bg-surface after:shadow-sm after:transition-transform",
  {
    variants: {
      size: {
        sm: "h-5 w-9 after:size-4 after:translate-x-0.5 peer-checked:after:translate-x-[1.125rem]",
        md: "h-6 w-11 after:size-5 after:translate-x-0.5 peer-checked:after:translate-x-[1.375rem]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

interface Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type">,
    VariantProps<typeof track> {
  label?: ReactNode;
  description?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Switch({
  label,
  description,
  size,
  className,
  disabled,
  ref,
  ...props
}: Props) {
  const control = (
    <span className="inline-flex">
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span aria-hidden className={cn(track({ size }), className)} />
    </span>
  );

  if (!label && !description) {
    return control;
  }

  return (
    <label
      className={cn(
        "flex items-center gap-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      {control}
      <span className="flex flex-col gap-0.5">
        {label && (
          <span className="text-body font-medium text-foreground">{label}</span>
        )}
        {description && (
          <span className="text-caption text-foreground-subtle">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
