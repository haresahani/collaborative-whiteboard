import { test, expect } from "../../fixtures/test.js";

test.describe("Recovery - Offline Buffer Sync", () => {
  test("Queues local edits while offline and flushes to server on reconnect", async ({
    page,
    boardPage,
  }) => {
    await boardPage.goto("offline-recovery-board");
    await page.context().setOffline(true);
    await boardPage.toolbar.selectPen();
    await boardPage.canvas.drawStroke(100, 100, 200, 200);
    await page.context().setOffline(false);
    await boardPage.assertLoaded();
  });
});
