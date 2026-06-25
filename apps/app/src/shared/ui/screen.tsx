import type { HTMLAttributes } from "react";

export const Screen = ({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex min-h-full flex-col bg-zinc-50 ${className}`}
    {...props}
  />
);
