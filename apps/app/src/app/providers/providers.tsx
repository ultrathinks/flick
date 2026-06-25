import { AppStateProvider } from "@b1nd/aid-kit/app-state";
import { BridgeProvider } from "@b1nd/aid-kit/bridge-kit/web";
import { RouteProvider } from "@b1nd/aid-kit/navigation";
import { SafeAreaProvider } from "@b1nd/aid-kit/safe-area-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { routes } from "@/app/routes";
import { queryClient } from "./query-client.ts";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => (
  <BridgeProvider>
    <SafeAreaProvider>
      <AppStateProvider>
        <RouteProvider routes={routes}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </RouteProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  </BridgeProvider>
);
