import { test, expect } from "../../fixtures/test.js";

test.describe("Environment Checks", () => {
  test("Verifies base URL is responsive", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
  });
});
