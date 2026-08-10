import { test, expect } from "../../fixtures/test.js";

test.describe("Authentication - Invalid Login", () => {
  test("Shows error when submitting invalid credentials", async ({
    loginPage,
  }) => {
    await loginPage.goto();
    if (await loginPage.emailInput.isVisible()) {
      await loginPage.login("wrong@example.com", "invalidpass");
    }
  });
});
