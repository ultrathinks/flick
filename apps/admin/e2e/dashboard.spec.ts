import { expect, test } from "./fixtures.ts";

test("shows the dashboard after seeding an admin session", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "현황" })).toBeVisible();
});

test("lists a pending booth on the approval queue", async ({ page }) => {
  await page.goto("/booths");

  await expect(page.getByRole("heading", { name: "부스 승인" })).toBeVisible();
  await expect(page.getByText("떡볶이 부스")).toBeVisible();
});
