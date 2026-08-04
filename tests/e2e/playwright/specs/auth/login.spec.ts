import { test, expect } from "../../fixtures/test.js";

test.describe("Authentication - Login", () => {
  test("User can navigate to login page", async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.page).toHaveURL(/\/board\//);
  });
});
