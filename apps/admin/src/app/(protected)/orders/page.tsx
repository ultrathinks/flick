import { SectionHeader } from "@/shared/ui";
import { OrderMonitor } from "@/widgets/order-monitor";

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="주문" />
      <OrderMonitor />
    </div>
  );
}
