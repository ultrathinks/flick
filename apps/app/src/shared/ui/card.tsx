import type { HTMLAttributes } from "react";

export const Card = ({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`rounded-2xl border border-zinc-100 bg-white p-5 ${className}`}
    {...props}
  />
);
