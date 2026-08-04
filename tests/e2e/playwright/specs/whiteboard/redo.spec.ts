import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Redo", () => {
  test("Clicking redo restores undone operation", async ({ boardPage }) => {
    await boardPage.goto("redo-board");
    await boardPage.toolbar.selectPen();
    await boardPage.canvas.drawStroke(100, 100, 200, 200);
    await boardPage.toolbar.clickUndo();
    await boardPage.toolbar.clickRedo();
  });
});
