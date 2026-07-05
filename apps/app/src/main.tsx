import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app";
import { writeTokens } from "@/entities/session";
import "@/app/styles/globals.css";

async function enableMocking(): Promise<void> {
  if (!import.meta.env.VITE_MOCK) {
    return;
  }
  const { worker } = await import("@/mocks/browser.ts");
  await worker.start({ onUnhandledRequest: "bypass" });
  writeTokens({ accessToken: "mock-access", refreshToken: "mock-refresh" });
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("root element not found");
}

void enableMocking().then(() => {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
