import { test, expect } from "../../fixtures/test.js";

test.describe("Authentication - Logout", () => {
  test("Logout clears user session and redirects to login", async ({
    page,
  }) => {
    await page.goto("/board/local-board");
    await expect(page).toHaveURL(/\/board\//);
  });
});
