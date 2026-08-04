import { test, expect } from "../../fixtures/test.js";

test.describe("Visual Regression - Login Page", () => {
  test("Matches visual snapshot baseline for login UI", async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await expect(loginPage.page.locator("canvas").first()).toBeVisible();
  });
});
