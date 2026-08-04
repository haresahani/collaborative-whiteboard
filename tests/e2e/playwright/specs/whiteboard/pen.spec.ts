import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Pen Tool", () => {
  test("Selecting pen tool activates pen drawing mode", async ({
    boardPage,
  }) => {
    await boardPage.goto("pen-tool-board");
    await boardPage.toolbar.selectPen();
    await boardPage.canvas.drawStroke(100, 100, 200, 200);
  });
});
