"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "size-4 border-2",
  md: "size-5 border-2",
  lg: "size-6 border-[3px]",
};

export function Loader({
  size = "md",
  delayMs = 0,
  className,
}: {
  size?: Size;
  delayMs?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(delayMs === 0);

  useEffect(() => {
    if (delayMs === 0) {
      return;
    }
    const id = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);

  if (!visible) {
    return null;
  }

  return (
    <span
      role="status"
      aria-label="로딩 중"
      className={cn(
        "inline-block animate-spin rounded-full border-border border-t-brand",
        sizes[size],
        className,
      )}
    />
  );
}
