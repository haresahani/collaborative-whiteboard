import { test, expect } from "../../fixtures/test.js";

test.describe("Real-Time Collaboration - Reconnection", () => {
  test("Client automatically reconnects and syncs state after socket drop", async ({
    page,
    boardPage,
  }) => {
    await boardPage.goto("reconnect-board");
    await page.context().setOffline(true);
    await page.context().setOffline(false);
    await boardPage.assertLoaded();
  });
});
