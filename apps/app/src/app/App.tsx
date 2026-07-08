import { Router } from "@b1nd/aid-kit/navigation";
import { installSessionAuth } from "@/entities/session";
import { AuthGate } from "@/features/auth-gate";
import { installBridgeMock } from "@/shared/lib";
import { resetRouterStack } from "./lib/reset-router-stack.ts";
import { Providers } from "./providers";
import { routes } from "./routes";

installBridgeMock();
installSessionAuth();
resetRouterStack();

export const App = () => (
  <Providers>
    <AuthGate>
      <div className="relative flex h-dvh flex-col overflow-hidden">
        <div className="relative flex-1 overflow-hidden">
          <Router routes={routes} />
        </div>
      </div>
    </AuthGate>
  </Providers>
);
