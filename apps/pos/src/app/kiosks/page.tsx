"use client";

import { AuthGate } from "@/features/auth-gate";
import { BoothScreen } from "@/widgets/app-shell";
import { KioskManager } from "@/widgets/kiosk-manager";

export default function Page() {
  return (
    <AuthGate>
      <BoothScreen tab="kiosks">
        {(booth) => <KioskManager booth={booth} />}
      </BoothScreen>
    </AuthGate>
  );
}
