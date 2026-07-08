import type { InputHTMLAttributes, ReactNode } from "react";
import { FieldShell, fieldClass } from "../lib/field";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: ReactNode;
}

export function Input({ label, error, help, className, ...props }: Props) {
  return (
    <FieldShell label={label} error={error} help={help}>
      <input
        aria-invalid={error ? true : undefined}
        className={fieldClass(Boolean(error), "h-11", className)}
        {...props}
      />
    </FieldShell>
  );
}
