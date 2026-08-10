import { test, expect } from "../../fixtures/test.js";

test.describe("Board Management - Create Board", () => {
  test("Navigating to new board URL loads whiteboard canvas", async ({
    boardPage,
  }) => {
    const uniqueId = `e2e-new-board-${Date.now()}`;
    await boardPage.goto(uniqueId);
    await boardPage.assertLoaded();
  });
});
