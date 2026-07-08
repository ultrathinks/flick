"use client";

import { AuthGate } from "@/features/auth-gate";
import { Page } from "@/shared/ui";
import { BoothScreen } from "@/widgets/app-shell";
import { OrderBoard } from "@/widgets/order-board";

export default function OrdersPage() {
  return (
    <AuthGate>
      <BoothScreen tab="orders">
        {(booth) => (
          <Page
            title="주문 · 매출"
            description="결제 내역과 매출을 확인하세요."
          >
            <OrderBoard booth={booth} />
          </Page>
        )}
      </BoothScreen>
    </AuthGate>
  );
}
