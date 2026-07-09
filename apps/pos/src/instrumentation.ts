export async function register(): Promise<void> {
  if (process.env.NEXT_PUBLIC_MOCK !== "1") {
    return;
  }
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { server } = await import("@/mocks/node.ts");
  server.listen({ onUnhandledRequest: "bypass" });
}
