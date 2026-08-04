import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Selection & Transform", () => {
  test("Selects drawn element on click", async ({ boardPage }) => {
    await boardPage.goto("selection-board");
    await boardPage.toolbar.selectRectangle();
    await boardPage.canvas.drawRectangle(200, 200, 100, 100);
    await boardPage.toolbar.selectSelection();
    await boardPage.canvas.clickAt(250, 250);
  });
});
