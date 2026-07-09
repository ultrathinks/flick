import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../lib/cn";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({
  label,
  description,
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
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          "flex size-5 items-center justify-center rounded-card-sm border border-border bg-surface text-brand-foreground transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-disabled:opacity-40 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
          className,
        )}
      >
        <Check size={14} strokeWidth={3} />
      </span>
    </span>
  );

  if (!label && !description) {
    return control;
  }

  return (
    <label
      className={cn(
        "flex items-start gap-2.5",
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
