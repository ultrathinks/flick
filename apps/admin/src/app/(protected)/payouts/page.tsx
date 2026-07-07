import { SectionHeader } from "@/shared/ui";
import { PayoutBoard } from "@/widgets/payout-board";

export default function PayoutsPage() {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="환급" />
      <PayoutBoard />
    </div>
  );
}
