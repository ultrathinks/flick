"use client";

import { AuthGate } from "@/features/auth-gate";
import { BoothScreen } from "@/widgets/app-shell";
import { OrderBoard } from "@/widgets/order-board";

export default function Page() {
  return (
    <AuthGate>
      <BoothScreen tab="orders">
        {(booth) => <OrderBoard booth={booth} />}
      </BoothScreen>
    </AuthGate>
  );
}
