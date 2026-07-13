import { Router } from "@b1nd/aid-kit/navigation";
import { installSessionAuth } from "@/entities/session";
import { AuthGate } from "@/features/auth-gate";
import { installBridgeMock } from "@/shared/lib";
import { ErrorBoundary } from "@/shared/ui";
import { resetRouterStack } from "./lib/reset-router-stack.ts";
import { Providers } from "./providers";
import { routes } from "./routes";

installBridgeMock();
installSessionAuth();
resetRouterStack();

export const App = () => (
  <Providers>
    <ErrorBoundary>
      <AuthGate>
        <div className="relative flex h-dvh flex-col overflow-hidden [&>*]:min-h-0 [&>*]:flex-1">
          <Router routes={routes} />
        </div>
      </AuthGate>
    </ErrorBoundary>
  </Providers>
);
