import { expect, test } from "./fixtures.ts";

test("shows the booth menu dashboard after seeding a mock session", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { name: "메뉴 관리" })).toBeVisible();
});

test("lists mocked orders with revenue on the orders page", async ({
  page,
}) => {
  await page.goto("/orders");

  await expect(
    page.getByRole("heading", { name: "주문 · 매출" }),
  ).toBeVisible();
  await expect(page.getByText("7,000원").first()).toBeVisible();
});
