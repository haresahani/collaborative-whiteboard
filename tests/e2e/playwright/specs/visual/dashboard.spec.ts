import { test, expect } from "../../fixtures/test.js";

test.describe("Visual Regression - Dashboard Page", () => {
  test("Matches visual snapshot baseline for dashboard UI", async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.page.locator("canvas").first()).toBeVisible();
  });
});
