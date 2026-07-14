"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { ArcRefresh, type ArcRefreshHandle } from "./arc-refresh";

const DEFAULT_THRESHOLD = 64;
const RESIST_C = 0.55;
const DEADZONE = 6;
const ARC_SIZE = 28;
const STIFFNESS = 220;
const DAMPING = 30;
const MASS = 1;
const REST = 0.001;
const SYNTHETIC_MOUSE_MS = 700;
const MIN_SPIN_MS = 450;

interface PullToRefreshProps {
  onRefresh: () => unknown;
  children: ReactNode;
  className?: string;
  threshold?: number;
  onReachThreshold?: () => void;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = DEFAULT_THRESHOLD,
  onReachThreshold,
  disabled = false,
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<ArcRefreshHandle>(null);

  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const onReachRef = useRef(onReachThreshold);
  const disabledRef = useRef(disabled);
  const thresholdRef = useRef(threshold);
  onRefreshRef.current = onRefresh;
  onReachRef.current = onReachThreshold;
  disabledRef.current = disabled;
  thresholdRef.current = threshold;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    let active = false;
    let owning = false;
    let decided = false;
    let armed = false;
    let startX = 0;
    let startY = 0;
    let dimension = 0;
    let offset = 0;
    let prevOffset = 0;
    let lastT = 0;
    let velocity = 0;
    let raf: number | null = null;
    let pendingOffset = 0;
    let cancelSpring: (() => void) | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const setRefreshingBoth = (value: boolean) => {
      refreshingRef.current = value;
      setRefreshing(value);
    };

    const resist = (distance: number, height: number) =>
      (1 - 1 / ((distance * RESIST_C) / height + 1)) * height;

    const applyOffset = (value: number) => {
      offset = value;
      const content = contentRef.current;
      if (content) {
        content.style.transform =
          value > 0 ? `translate3d(0, ${value}px, 0)` : "";
      }
      if (!refreshingRef.current) {
        arcRef.current?.setProgress(value / thresholdRef.current);
      }
    };

    const scheduleRender = (value: number) => {
      pendingOffset = value;
      if (raf != null) {
        return;
      }
      raf = requestAnimationFrame(() => {
        raf = null;
        applyOffset(pendingOffset);
      });
    };

    const clearWillChange = () => {
      const content = contentRef.current;
      if (content) {
        content.style.willChange = "";
      }
    };

    const spring = (
      from: number,
      to: number,
      initialVelocity: number,
      onDone?: () => void,
    ) => {
      cancelSpring?.();
      const zeta = DAMPING / (2 * Math.sqrt(STIFFNESS * MASS));
      const omega0 = Math.sqrt(STIFFNESS / MASS);
      const omega1 = omega0 * Math.sqrt(Math.max(0, 1 - zeta * zeta));
      const x0 = to - from;
      const start = performance.now();
      let frame = 0;

      const tick = (now: number) => {
        const t = (now - start) / 1000;
        let position: number;
        let velocityNow: number;
        if (zeta < 1) {
          const e = Math.exp(-zeta * omega0 * t);
          const c1 = x0;
          const c2 = (initialVelocity + zeta * omega0 * x0) / omega1;
          position =
            to - e * (c1 * Math.cos(omega1 * t) + c2 * Math.sin(omega1 * t));
          velocityNow =
            e *
            ((c1 * zeta * omega0 - c2 * omega1) * Math.cos(omega1 * t) +
              (c1 * omega1 + c2 * zeta * omega0) * Math.sin(omega1 * t));
        } else {
          const e = Math.exp(-omega0 * t);
          position = to - e * (x0 + (initialVelocity + omega0 * x0) * t);
          velocityNow =
            e * (initialVelocity * (1 - omega0 * t) - x0 * omega0 * omega0 * t);
        }

        if (Math.abs(velocityNow) < REST && Math.abs(to - position) < REST) {
          applyOffset(to);
          cancelSpring = null;
          onDone?.();
          return;
        }
        applyOffset(position);
        frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
      cancelSpring = () => {
        cancelAnimationFrame(frame);
        cancelSpring = null;
      };
    };

    const settle = () => {
      spring(offset, 0, 0, () => {
        setRefreshingBoth(false);
        clearWillChange();
        applyOffset(0);
      });
    };

    const startRefresh = (releaseVelocity: number) => {
      setRefreshingBoth(true);
      spring(offset, thresholdRef.current, releaseVelocity);
      const startedAt = performance.now();
      Promise.resolve()
        .then(() => onRefreshRef.current?.())
        .finally(() => {
          const wait = Math.max(
            0,
            MIN_SPIN_MS - (performance.now() - startedAt),
          );
          refreshTimer = setTimeout(() => {
            refreshTimer = null;
            settle();
          }, wait);
        });
    };

    let mouseTracking = false;
    let lastTouchTime = 0;

    const finish = () => {
      if (!active) {
        return;
      }
      active = false;
      if (!owning) {
        return;
      }
      owning = false;
      if (raf != null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      applyOffset(pendingOffset);
      if (offset >= thresholdRef.current) {
        startRefresh(velocity);
      } else {
        spring(offset, 0, velocity, clearWillChange);
      }
    };

    const begin = (clientX: number, clientY: number) => {
      if (disabledRef.current || refreshingRef.current || el.scrollTop > 0) {
        return false;
      }
      cancelSpring?.();
      startX = clientX;
      startY = clientY;
      prevOffset = 0;
      velocity = 0;
      lastT = performance.now();
      active = true;
      owning = false;
      decided = false;
      armed = false;
      dimension = el.clientHeight || window.innerHeight;
      return true;
    };

    const move = (clientX: number, clientY: number, prevent: () => void) => {
      if (!active || refreshingRef.current) {
        return;
      }
      const dy = clientY - startY;
      const dx = clientX - startX;

      if (!decided) {
        if (Math.abs(dx) < DEADZONE && Math.abs(dy) < DEADZONE) {
          return;
        }
        decided = true;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
          active = false;
          return;
        }
        owning = true;
        const content = contentRef.current;
        if (content) {
          content.style.willChange = "transform";
        }
      }

      if (!owning) {
        return;
      }
      if (el.scrollTop > 0) {
        finish();
        return;
      }
      prevent();

      const next = dy > 0 ? resist(dy, dimension) : 0;
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) {
        velocity = ((next - prevOffset) / dt) * 1000;
      }
      prevOffset = next;
      lastT = now;

      const trigger = thresholdRef.current;
      if (!armed && next >= trigger) {
        armed = true;
        onReachRef.current?.();
      } else if (armed && next < trigger) {
        armed = false;
      }

      scheduleRender(next);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        return;
      }
      const touch = e.touches[0];
      if (!touch) {
        return;
      }
      lastTouchTime = performance.now();
      begin(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (e.touches.length !== 1 || !touch) {
        finish();
        return;
      }
      lastTouchTime = performance.now();
      move(touch.clientX, touch.clientY, () => {
        if (e.cancelable) {
          e.preventDefault();
        }
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      move(e.clientX, e.clientY, () => e.preventDefault());
    };

    const onMouseUp = () => {
      if (mouseTracking) {
        mouseTracking = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }
      finish();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) {
        return;
      }
      if (performance.now() - lastTouchTime < SYNTHETIC_MOUSE_MS) {
        return;
      }
      if (!begin(e.clientX, e.clientY)) {
        return;
      }
      mouseTracking = true;
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", finish, { passive: true });
    el.addEventListener("touchcancel", finish, { passive: true });
    el.addEventListener("mousedown", onMouseDown);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", finish);
      el.removeEventListener("touchcancel", finish);
      el.removeEventListener("mousedown", onMouseDown);
      if (mouseTracking) {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }
      cancelSpring?.();
      if (raf != null) {
        cancelAnimationFrame(raf);
      }
      if (refreshTimer != null) {
        clearTimeout(refreshTimer);
      }
    };
  }, []);

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "relative touch-pan-y overflow-y-auto overscroll-y-contain",
        className,
      )}
    >
      <div ref={contentRef} className="relative flex min-h-full flex-col">
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center"
          style={{ top: -(ARC_SIZE + 12) }}
        >
          <ArcRefresh ref={arcRef} size={ARC_SIZE} spinning={refreshing} />
        </div>
        {children}
      </div>
    </div>
  );
}
