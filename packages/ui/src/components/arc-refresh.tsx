"use client";

import { type Ref, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { cn } from "../lib/cn";

export interface ArcRefreshHandle {
  setProgress: (progress: number) => void;
}

interface ArcRefreshProps {
  size?: number;
  strokeWidth?: number;
  spinning?: boolean;
  className?: string;
  ref?: Ref<ArcRefreshHandle>;
}

export function ArcRefresh({
  size = 28,
  strokeWidth = 2.5,
  spinning = false,
  className,
  ref,
}: ArcRefreshProps) {
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const wrapRef = useRef<HTMLSpanElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  const apply = (progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = String(
        circumference * (1 - clamped),
      );
    }
    if (wrapRef.current) {
      wrapRef.current.style.opacity = String(Math.min(1, clamped * 1.4));
      wrapRef.current.style.transform = `scale(${0.6 + clamped * 0.4})`;
    }
  };

  useImperativeHandle(ref, () => ({ setProgress: apply }));

  useLayoutEffect(() => {
    if (spinning) {
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(circumference * 0.75);
      }
      if (wrapRef.current) {
        wrapRef.current.style.opacity = "1";
        wrapRef.current.style.transform = "scale(1)";
      }
    }
  }, [spinning, circumference]);

  return (
    <span
      ref={wrapRef}
      className={cn("inline-flex text-foreground-subtle", className)}
      style={{
        opacity: 0,
        willChange: "transform, opacity",
        transformOrigin: "50% 50%",
      }}
    >
      <span className={cn("inline-flex", spinning && "animate-spin")}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
          />
        </svg>
      </span>
    </span>
  );
}
