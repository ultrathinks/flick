import { expect, test } from "@playwright/test";

test("auto-seeds a mock admin session for unauthenticated visitors", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "현황" })).toBeVisible();
});
