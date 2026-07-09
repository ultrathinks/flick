import { ConfirmProvider, ToastProvider } from "@flick/ui";
import { ThemeProvider } from "@flick/ui/theme";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
