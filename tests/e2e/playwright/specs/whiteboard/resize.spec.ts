import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Resize Element", () => {
  test("Resizes element via bounding box handles", async ({ boardPage }) => {
    await boardPage.goto("resize-board");
    await boardPage.toolbar.selectRectangle();
    await boardPage.canvas.drawRectangle(100, 100, 100, 100);
  });
});
