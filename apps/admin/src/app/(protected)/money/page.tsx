import { SectionHeader } from "@/shared/ui";
import { ChargePanel } from "@/widgets/charge-panel";

export default function MoneyPage() {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="충전" />
      <ChargePanel />
    </div>
  );
}
