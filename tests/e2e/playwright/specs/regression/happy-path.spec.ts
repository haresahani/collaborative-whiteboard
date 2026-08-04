import { test, expect } from "../../fixtures/test.js";

test.describe("Full E2E Regression - Happy Path User Journey", () => {
  test("User joins whiteboard, selects tools, draws shapes, and triggers undo/redo", async ({
    boardPage,
  }) => {
    const boardId = `regression-happy-${Date.now()}`;
    await boardPage.goto(boardId);
    await boardPage.assertLoaded();

    // 1. Select Pen and draw stroke
    await boardPage.toolbar.selectPen();
    await boardPage.canvas.drawStroke(150, 150, 250, 250);

    // 2. Select Rectangle and draw shape
    await boardPage.toolbar.selectRectangle();
    await boardPage.canvas.drawRectangle(300, 150, 100, 100);

    // 3. Trigger Undo and Redo
    await boardPage.toolbar.clickUndo();
    await boardPage.toolbar.clickRedo();
  });
});
