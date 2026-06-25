import { formatWon } from "@/shared/lib";

interface MoneyProps {
  amount: number;
  className?: string;
}

export const Money = ({ amount, className = "" }: MoneyProps) => (
  <span className={`tabular-nums ${className}`}>{formatWon(amount)}</span>
);
