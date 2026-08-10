import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Zoom Controls", () => {
  test("Zooms canvas in and out via keyboard shortcuts", async ({
    boardPage,
  }) => {
    await boardPage.goto("zoom-board");
    await boardPage.canvas.zoomIn();
    await boardPage.canvas.zoomOut();
  });
});
