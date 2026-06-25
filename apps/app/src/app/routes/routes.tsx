import type { Routes } from "@b1nd/aid-kit/navigation";
import { HomePage } from "@/pages/home";
import { MyCodePage } from "@/pages/my-code";
import { PayPage } from "@/pages/pay";
import { PaymentPage } from "@/pages/payment";
import { ProfilePage } from "@/pages/profile";
import { TransactionDetailPage } from "@/pages/transaction-detail";
import { TransactionsPage } from "@/pages/transactions";

export const routes: Routes = {
  tabs: [
    { path: "/", index: true, element: HomePage },
    { path: "/pay", element: PayPage },
    { path: "/transactions", element: TransactionsPage },
    { path: "/profile", element: ProfilePage },
  ],
  stacks: [
    { path: "/my-code", element: MyCodePage },
    { path: "/payment/:code", element: PaymentPage },
    { path: "/transaction/:id", element: TransactionDetailPage },
  ],
};
