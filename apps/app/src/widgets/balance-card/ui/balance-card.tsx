import { useRouter } from "@b1nd/aid-kit/navigation";
import { RollingNumber } from "@flick/ui";

interface BalanceCardProps {
  name: string;
  balance: number;
}

export const BalanceCard = ({ name, balance }: BalanceCardProps) => {
  const { stack } = useRouter();

  return (
    <div className="rounded-card bg-brand p-5 text-brand-foreground">
      <p className="truncate text-body text-brand-foreground/70">
        {name}님의 잔액
      </p>
      <RollingNumber
        value={balance}
        className="mt-1 block text-display font-bold"
      />
      <button
        type="button"
        onClick={() => stack.push("/my-code")}
        className="mt-4 inline-flex h-10 items-center rounded-full bg-brand-foreground px-4 text-body font-semibold text-brand transition-transform active:scale-[0.98]"
      >
        충전 코드 보기
      </button>
    </div>
  );
};
