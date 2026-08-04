import { test, expect } from "../../fixtures/test.js";

test.describe("Recovery - Snapshot Sync", () => {
  test("Fetches board snapshot state upon initial connection", async ({
    boardPage,
  }) => {
    await boardPage.goto("snapshot-board");
    await boardPage.assertLoaded();
  });
});
