import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Undo", () => {
  test("Clicking undo reverts last drawn operation", async ({ boardPage }) => {
    await boardPage.goto("undo-board");
    await boardPage.toolbar.selectPen();
    await boardPage.canvas.drawStroke(100, 100, 200, 200);
    await boardPage.toolbar.clickUndo();
  });
});
