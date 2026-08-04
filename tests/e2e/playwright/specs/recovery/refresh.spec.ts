import { test, expect } from "../../fixtures/test.js";

test.describe("Recovery - Page Refresh", () => {
  test("Canvas elements persist after browser page refresh", async ({
    page,
    boardPage,
  }) => {
    await boardPage.goto("refresh-recovery-board");
    await boardPage.toolbar.selectPen();
    await boardPage.canvas.drawStroke(150, 150, 250, 250);
    await page.reload();
    await boardPage.assertLoaded();
  });
});
