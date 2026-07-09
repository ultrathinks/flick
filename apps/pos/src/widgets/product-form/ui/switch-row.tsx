"use client";

import { Switch } from "@/shared/ui";

export function SwitchRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-3 py-3.5 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-heading font-medium text-foreground">
          {title}
        </span>
        {description && (
          <span className="text-caption text-foreground-subtle">
            {description}
          </span>
        )}
      </span>
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={title}
      />
    </label>
  );
}
