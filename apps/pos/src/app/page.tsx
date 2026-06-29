"use client";

import { AuthGate } from "@/features/auth-gate";
import { BoothScreen } from "@/widgets/app-shell";
import { BoothDashboard } from "@/widgets/booth-dashboard";

export default function Page() {
  return (
    <AuthGate>
      <BoothScreen tab="menu">
        {(booth) => <BoothDashboard booth={booth} />}
      </BoothScreen>
    </AuthGate>
  );
}
