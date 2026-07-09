import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto("/api/mock/seed");
    await page.waitForURL("/");
    await use(page);
  },
});

export { expect };
