"use client";

import { BoothScreen } from "@/widgets/app-shell";
import { BoothDashboard } from "@/widgets/booth-dashboard";

export default function MenuPage() {
  return (
    <BoothScreen tab="menu">
      {(booth) => <BoothDashboard booth={booth} />}
    </BoothScreen>
  );
}
