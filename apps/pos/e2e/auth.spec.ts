import { expect, test } from "@playwright/test";

test("auto-seeds a mock session for unauthenticated visitors", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "메뉴 관리" })).toBeVisible();
});
