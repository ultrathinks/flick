import { ArrowRight, Check } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/shared/ui";

interface SlideToPayProps {
  label?: string;
  confirmingLabel?: string;
  disabled?: boolean;
  onConfirm: () => void;
}

const KNOB = 48;
const PAD = 4;

export const SlideToPay = ({
  label = "밀어서 결제",
  confirmingLabel = "결제 중…",
  disabled = false,
  onConfirm,
}: SlideToPayProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [committed, setCommitted] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const maxRef = useRef(0);

  const begin = (clientX: number, pointerId: number, target: Element) => {
    if (disabled || committed) {
      return;
    }
    const track = trackRef.current;
    if (!track) {
      return;
    }
    dragging.current = true;
    startX.current = clientX;
    maxRef.current = track.clientWidth - KNOB - PAD * 2;
    target.setPointerCapture(pointerId);
  };

  const move = (clientX: number) => {
    if (!dragging.current) {
      return;
    }
    const next = Math.max(
      0,
      Math.min(maxRef.current, clientX - startX.current),
    );
    setOffset(next);
    if (next >= maxRef.current - 1) {
      dragging.current = false;
      setCommitted(true);
      onConfirm();
    }
  };

  const end = () => {
    if (!dragging.current) {
      return;
    }
    dragging.current = false;
    if (!committed) {
      setOffset(0);
    }
  };

  const progress = maxRef.current > 0 ? offset / maxRef.current : 0;

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative h-14 select-none overflow-hidden rounded-full bg-surface-muted",
        disabled && "opacity-40",
      )}
      style={{ touchAction: "none" }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-brand"
        style={{ width: KNOB + PAD * 2 + offset }}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center text-heading font-semibold transition-colors",
          progress > 0.55 || committed
            ? "text-brand-foreground"
            : "text-foreground-subtle",
        )}
      >
        {committed ? confirmingLabel : label}
      </span>
      <button
        type="button"
        aria-label={label}
        disabled={disabled || committed}
        onPointerDown={(e) => begin(e.clientX, e.pointerId, e.currentTarget)}
        onPointerMove={(e) => move(e.clientX)}
        onPointerUp={end}
        onPointerCancel={end}
        className="absolute top-1 flex size-12 items-center justify-center rounded-full bg-surface text-brand shadow-[var(--shadow-overlay)]"
        style={{ left: PAD + offset, touchAction: "none" }}
      >
        {committed ? (
          <Check className="size-5" strokeWidth={2.5} aria-hidden />
        ) : (
          <ArrowRight className="size-5" strokeWidth={2.5} aria-hidden />
        )}
      </button>
    </div>
  );
};
