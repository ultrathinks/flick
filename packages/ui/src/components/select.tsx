import type { ReactNode, SelectHTMLAttributes } from "react";
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
      <select
        aria-invalid={error ? true : undefined}
        className={fieldClass(Boolean(error), "h-11", className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
