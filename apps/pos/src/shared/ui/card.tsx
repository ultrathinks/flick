import type { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-zinc-100 bg-white p-4 shadow-sm ${className}`}
      {...props}
    />
  );
}
