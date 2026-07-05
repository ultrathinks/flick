import { cn } from "@flick/ui";
import type { HTMLAttributes } from "react";

export const Screen = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex min-h-full flex-col bg-bg", className)} {...props} />
);
