"use client";

import { useMyBooth } from "@/entities/booth";
import { AuthGate } from "@/features/auth-gate";
import { BoothDashboard } from "@/widgets/booth-dashboard";
import { BoothOnboarding } from "@/widgets/booth-onboarding";

function Home() {
  const booth = useMyBooth();

  if (booth.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">
        불러오는 중…
      </div>
    );
  }

  if (!booth.data) {
    return <BoothOnboarding />;
  }

  return <BoothDashboard booth={booth.data} />;
}

export default function Page() {
  return (
    <AuthGate>
      <Home />
    </AuthGate>
  );
}
