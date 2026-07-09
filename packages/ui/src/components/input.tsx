import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { FieldShell, fieldClass } from "../lib/field";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  label,
  error,
  help,
  required,
  className,
  ref,
  ...props
}: Props) {
  return (
    <FieldShell label={label} error={error} help={help} required={required}>
      <input
        ref={ref}
        required={required}
        aria-invalid={error ? true : undefined}
        className={fieldClass(Boolean(error), "h-11", className)}
        {...props}
      />
    </FieldShell>
  );
}
