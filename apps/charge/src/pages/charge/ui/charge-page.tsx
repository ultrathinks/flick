import { useSafeArea } from "@b1nd/aid-kit/safe-area-provider";
import { Screen } from "@/shared/ui";
import { ChargeFlow } from "@/widgets/charge-flow";

export const ChargePage = () => {
  const { top, bottom } = useSafeArea();

  return (
    <Screen className="h-full">
      <ChargeFlow topInset={top} bottomInset={bottom} />
    </Screen>
  );
};
