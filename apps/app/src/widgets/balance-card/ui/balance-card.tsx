import { useRouter } from "@b1nd/aid-kit/navigation";
import { Button, RollingNumber } from "@flick/ui";

interface BalanceCardProps {
  name: string;
  balance: number;
}

export const BalanceCard = ({ name, balance }: BalanceCardProps) => {
  const { stack } = useRouter();

  return (
    <div className="rounded-card bg-brand p-5 text-brand-foreground shadow-[var(--shadow-card)]">
      <p className="text-body text-brand-foreground/70">{name}님의 잔액</p>
      <RollingNumber
        value={balance}
        className="mt-1 block text-display font-bold"
      />
      <Button
        size="sm"
        onClick={() => stack.push("/my-code")}
        className="mt-4 rounded-full bg-white/15 text-brand-foreground hover:bg-white/20 active:bg-white/25"
      >
        충전 코드 보기
      </Button>
    </div>
  );
};
