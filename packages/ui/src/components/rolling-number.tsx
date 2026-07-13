"use client";

import { useEffect, useRef } from "react";
import { cn } from "../lib/cn";
import { formatWon } from "../lib/format";

interface Props {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
}

export function RollingNumber({
  value,
  durationMs = 700,
  format = formatWon,
  className,
}: Props) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const displayRef = useRef(value);
  const mountedRef = useRef(false);

  useEffect(() => {
    const node = spanRef.current;
    if (!node) {
      return;
    }
    const from = displayRef.current;
    if (from === value) {
      node.textContent = format(value);
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!mountedRef.current || reduced) {
      mountedRef.current = true;
      displayRef.current = value;
      node.textContent = format(value);
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) {
        start = now;
      }
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(from + (value - from) * eased);
      displayRef.current = current;
      node.textContent = format(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, format]);

  return (
    <span
      ref={spanRef}
      className={cn("whitespace-nowrap tabular-nums", className)}
      aria-label={format(value)}
    >
      {format(displayRef.current)}
    </span>
  );
}
