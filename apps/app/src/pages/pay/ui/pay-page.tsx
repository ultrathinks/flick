import { PayByCode } from "@/features/pay-by-code";
import { Screen } from "@/shared/ui";
import { PageHeader } from "@/widgets/page-header";

export const PayPage = () => (
  <Screen className="flex-1 overflow-y-auto">
    <PageHeader title="결제" />
    <div className="px-5 pb-6">
      <PayByCode />
    </div>
  </Screen>
);
