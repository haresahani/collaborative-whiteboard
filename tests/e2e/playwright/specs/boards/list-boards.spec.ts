import { test, expect } from "../../fixtures/test.js";

test.describe("Board Management - List Boards", () => {
  test("Dashboard displays user boards or redirects to active board", async ({
    page,
  }) => {
    await page.goto("/board");
    await expect(page).toHaveURL(/\/board\//);
  });
});
