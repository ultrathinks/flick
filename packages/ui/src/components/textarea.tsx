import type { ReactNode, Ref, TextareaHTMLAttributes } from "react";
import { FieldShell, fieldClass } from "../lib/field";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  help?: ReactNode;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  label,
  error,
  help,
  className,
  ref,
  ...props
}: Props) {
  return (
    <FieldShell label={label} error={error} help={help}>
      <textarea
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={fieldClass(
          Boolean(error),
          "min-h-24 resize-none py-3",
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
}
