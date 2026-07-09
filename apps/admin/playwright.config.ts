import { defineConfig, devices } from "@playwright/test";

const PORT = 3003;
const baseURL = `http://localhost:${PORT}`;

const mockEnv = {
  NEXT_PUBLIC_MOCK: "1",
  BASE_API_URL: "http://localhost:3000/v1",
  BASE_INTERNAL_API_URL: "http://localhost:3000/v1",
  BASE_URL: baseURL,
  DAUTH_AUTHORIZE_URL: "https://dauth.b1nd.com/authorize",
  DAUTH_CLIENT_ID: "mock",
  DAUTH_REDIRECT_URI: `${baseURL}/api/auth/callback`,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec next build && pnpm exec next start --port ${PORT}`,
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: mockEnv,
  },
});
