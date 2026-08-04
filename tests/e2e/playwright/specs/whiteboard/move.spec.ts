import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Move Element", () => {
  test("Drags and moves element across canvas", async ({ boardPage }) => {
    await boardPage.goto("move-board");
    await boardPage.toolbar.selectRectangle();
    await boardPage.canvas.drawRectangle(100, 100, 100, 100);
    await boardPage.toolbar.selectSelection();
    await boardPage.canvas.drawStroke(150, 150, 300, 300);
  });
});
