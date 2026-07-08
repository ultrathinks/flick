import { Page } from "@/shared/ui";
import { BoothQueue } from "@/widgets/booth-queue";

export default function BoothsPage() {
  return (
    <Page title="부스 승인">
      <BoothQueue />
    </Page>
  );
}
