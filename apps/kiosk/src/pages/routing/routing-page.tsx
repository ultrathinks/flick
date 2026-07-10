import { useEffect } from "react";
import { useNavigate } from "react-router";
import { getCurrentKiosk } from "@/features/kiosk-pairing/api/pair-kiosk";
import { clearKioskData, getKioskSession } from "@/shared/model/storage";
import { Loading } from "@/shared/ui/loading";

export function RoutingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function routeBySession() {
      const { token } = getKioskSession();
      if (!token) {
        navigate("/pairing", { replace: true });
        return;
      }

      try {
        await getCurrentKiosk(token);
        if (active) {
          navigate("/products", { replace: true });
        }
      } catch {
        clearKioskData();
        if (active) {
          navigate("/pairing", { replace: true });
        }
      }
    }

    routeBySession();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-dvh flex-col bg-bg">
      <Loading label="키오스크 상태를 확인하는 중입니다" />
    </main>
  );
}
