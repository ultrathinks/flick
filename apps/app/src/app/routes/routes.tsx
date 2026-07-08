import type { Routes } from "@b1nd/aid-kit/navigation";
import { HomePage } from "@/pages/home";
import { MyCodePage } from "@/pages/my-code";
import { PaymentPage } from "@/pages/payment";
import { TransactionDetailPage } from "@/pages/transaction-detail";

export const routes: Routes = {
  tabs: [{ path: "/", index: true, element: HomePage }],
  stacks: [
    { path: "/my-code", element: MyCodePage },
    { path: "/payment/:code", element: PaymentPage },
    { path: "/transaction/:id", element: TransactionDetailPage },
  ],
};
