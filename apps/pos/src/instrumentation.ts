import { registerOTel } from "@vercel/otel";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    registerOTel({ serviceName: "flick-pos" });
  }

  if (process.env.NEXT_PUBLIC_MOCK === "1") {
    const { server } = await import("@/mocks/node.ts");
    server.listen({ onUnhandledRequest: "bypass" });
  }
}
