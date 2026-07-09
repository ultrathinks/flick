import type { Routes } from "@b1nd/aid-kit/navigation";
import { HomePage } from "@/pages/home";
import { MyCodePage } from "@/pages/my-code";
import { PayoutPage } from "@/pages/payout";
import { TransactionDetailPage } from "@/pages/transaction-detail";

export const routes: Routes = {
  tabs: [{ path: "/", index: true, element: HomePage }],
  stacks: [
    { path: "/my-code", element: MyCodePage },
    { path: "/payout", element: PayoutPage },
    { path: "/transaction/:id", element: TransactionDetailPage },
  ],
};
