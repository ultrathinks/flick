"use client";

import { AuthGate } from "@/features/auth-gate";
import { BoothScreen } from "@/widgets/app-shell";
import { BoothSettings } from "@/widgets/booth-settings";

export default function Page() {
  return (
    <AuthGate>
      <BoothScreen tab="settings">
        {(booth) => <BoothSettings booth={booth} />}
      </BoothScreen>
    </AuthGate>
  );
}
