import { test, expect } from "../../fixtures/test.js";

test.describe("Authentication - Signup", () => {
  test("User can navigate to signup page", async ({ signupPage }) => {
    await signupPage.goto();
    await expect(signupPage.page).toHaveURL(/\/board\//);
  });
});
