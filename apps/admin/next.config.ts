import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@flick/ui"],
  serverExternalPackages: ["msw", "@mswjs/interceptors"],
};

export default nextConfig;
