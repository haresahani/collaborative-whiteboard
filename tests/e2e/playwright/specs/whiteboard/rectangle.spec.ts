import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Rectangle Tool", () => {
  test("Draws a rectangle on the canvas", async ({ boardPage }) => {
    await boardPage.goto("rectangle-board");
    await boardPage.toolbar.selectRectangle();
    await boardPage.canvas.drawRectangle(150, 150, 200, 100);
  });
});
