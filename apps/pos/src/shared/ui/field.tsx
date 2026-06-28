import type { InputHTMLAttributes } from "react";

export function Field({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-600">
        {label}
      </span>
      <input
        className={`w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${className}`}
        {...props}
      />
    </label>
  );
}
