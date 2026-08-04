import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Arrow Tool", () => {
  test("Draws an arrow on the canvas", async ({ boardPage }) => {
    await boardPage.goto("arrow-board");
    await boardPage.toolbar.selectArrow();
    await boardPage.canvas.drawStroke(100, 150, 300, 150);
  });
});
