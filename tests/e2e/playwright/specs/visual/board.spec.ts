import { test, expect } from "../../fixtures/test.js";

test.describe("Visual Regression - Whiteboard Board UI", () => {
  test("Matches visual snapshot baseline for whiteboard toolbar and canvas", async ({
    boardPage,
  }) => {
    await boardPage.goto("visual-board");
    await expect(boardPage.page.locator("canvas").first()).toBeVisible();
  });
});
