import { cn } from "../lib/cn";
import { formatWon } from "../lib/format";

interface Props {
  amount: number;
  signed?: boolean;
  className?: string;
}

export function Money({ amount, signed = false, className }: Props) {
  const rounded = Math.round(amount);
  const text = signed
    ? `${rounded > 0 ? "+" : rounded < 0 ? "-" : ""}${formatWon(Math.abs(rounded))}`
    : formatWon(rounded);
  return <span className={cn("tabular-nums", className)}>{text}</span>;
}
