import { PayByCode } from "@/features/pay-by-code";
import { PageHeader } from "@/widgets/page-header";

export const PayPage = () => (
  <div className="flex flex-1 flex-col overflow-y-auto">
    <PageHeader title="결제" />
    <div className="px-5 pb-6">
      <PayByCode />
    </div>
  </div>
);
