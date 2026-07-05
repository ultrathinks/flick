import { cn } from "../lib/cn";
import { formatWon } from "../lib/format";

interface Props {
  amount: number;
  signed?: boolean;
  className?: string;
}

export function Money({ amount, signed = false, className }: Props) {
  const text = signed
    ? `${amount > 0 ? "+" : amount < 0 ? "-" : ""}${formatWon(Math.abs(amount))}`
    : formatWon(amount);
  return <span className={cn("tabular-nums", className)}>{text}</span>;
}
