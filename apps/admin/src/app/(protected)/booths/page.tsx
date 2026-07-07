import { SectionHeader } from "@/shared/ui";
import { BoothQueue } from "@/widgets/booth-queue";

export default function BoothsPage() {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="부스 승인" />
      <BoothQueue />
    </div>
  );
}
