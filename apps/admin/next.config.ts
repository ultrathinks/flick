import type { NextConfig } from "next";

if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_MOCK === "1"
) {
  throw new Error("NEXT_PUBLIC_MOCK must not be enabled in a production build");
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@flick/ui", "@flick/contract"],
  serverExternalPackages: ["msw", "@mswjs/interceptors"],
};

export default nextConfig;
