import { ChevronDown } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { FieldShell, fieldClass } from "../lib/field";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  help?: ReactNode;
}

export function Select({
  label,
  error,
  help,
  className,
  children,
  ...props
}: Props) {
  return (
    <FieldShell label={label} error={error} help={help}>
      <div className="relative">
        <select
          aria-invalid={error ? true : undefined}
          className={cn(
            fieldClass(Boolean(error), "h-11 appearance-none pr-10"),
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          strokeWidth={1.75}
          className="pointer-events-none absolute top-1/2 right-3.5 size-[18px] -translate-y-1/2 text-foreground-subtle"
        />
      </div>
    </FieldShell>
  );
}
