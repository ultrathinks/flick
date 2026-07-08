import { Page } from "@/shared/ui";
import { OrderMonitor } from "@/widgets/order-monitor";

export default function OrdersPage() {
  return (
    <Page title="주문">
      <OrderMonitor />
    </Page>
  );
}
