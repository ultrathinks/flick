import { cn, Icon } from "@flick/ui";
import { Delete } from "lucide-react";

interface NumericKeypadProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  onHaptic?: (style: "selection" | "error") => void;
  className?: string;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0"] as const;

export const NumericKeypad = ({
  value,
  onChange,
  max = Number.MAX_SAFE_INTEGER,
  onHaptic,
  className,
}: NumericKeypadProps) => {
  const current = value === 0 ? "" : String(value);

  const append = (digits: string) => {
    const next = Number(`${current}${digits}`);
    if (next > max) {
      onChange(max);
      onHaptic?.("error");
      return;
    }
    onChange(next);
    onHaptic?.("selection");
  };

  const remove = () => {
    if (current.length === 0) {
      return;
    }
    const trimmed = current.slice(0, -1);
    onChange(trimmed === "" ? 0 : Number(trimmed));
    onHaptic?.("selection");
  };

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-2 select-none touch-manipulation",
        className,
      )}
    >
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => append(key)}
          className="h-14 rounded-control text-subtitle font-semibold text-foreground transition-colors active:scale-[0.97] active:bg-surface-muted"
        >
          {key}
        </button>
      ))}
      <button
        type="button"
        onClick={remove}
        aria-label="지우기"
        className="flex h-14 items-center justify-center rounded-control text-foreground-subtle transition-colors active:scale-[0.97] active:bg-surface-muted"
      >
        <Icon icon={Delete} size={24} />
      </button>
    </div>
  );
};
