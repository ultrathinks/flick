"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCurrentKiosk } from "@/features/kiosk-pairing/api/pair-kiosk";
import { clearKioskData, getKioskSession } from "@/shared/model/storage";
import { SessionRoutingStatus } from "@/widgets/kiosk-routing/ui/session-routing-status";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function routeBySession() {
      const { token } = getKioskSession();
      if (!token) {
        router.replace("/pairing");
        return;
      }

      try {
        await getCurrentKiosk(token);
        if (active) {
          router.replace("/products");
        }
      } catch {
        clearKioskData();
        if (active) {
          router.replace("/pairing");
        }
      }
    }

    routeBySession();

    return () => {
      active = false;
    };
  }, [router]);

  return <SessionRoutingStatus />;
}
