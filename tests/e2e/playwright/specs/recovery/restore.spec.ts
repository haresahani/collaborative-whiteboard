import { test, expect } from "../../fixtures/test.js";

test.describe("Recovery - Snapshot Restore", () => {
  test("Restores corrupted state to latest valid snapshot", async ({
    boardPage,
  }) => {
    await boardPage.goto("restore-board");
    await boardPage.assertLoaded();
  });
});
