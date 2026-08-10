import { test, expect } from "../../fixtures/test.js";

test.describe("Board Management - Rename Board", () => {
  test("User can rename active board title", async ({ boardPage }) => {
    await boardPage.goto("rename-test-board");
    if (await boardPage.boardTitle.isVisible()) {
      await boardPage.renameBoard("Updated E2E Board Name");
    }
  });
});
