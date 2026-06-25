import { useRouter } from "@b1nd/aid-kit/navigation";
import { Card, Money } from "@/shared/ui";

interface BalanceCardProps {
  name: string;
  balance: number;
}

export const BalanceCard = ({ name, balance }: BalanceCardProps) => {
  const { stack } = useRouter();

  return (
    <Card className="bg-blue-600 text-white">
      <p className="text-sm text-blue-100">{name}님의 잔액</p>
      <Money amount={balance} className="mt-1 block text-3xl font-bold" />
      <button
        type="button"
        onClick={() => stack.push("/my-code")}
        className="mt-4 inline-flex h-9 items-center rounded-full bg-white/15 px-4 text-sm font-semibold text-white active:bg-white/25"
      >
        충전 코드 보기
      </button>
    </Card>
  );
};
