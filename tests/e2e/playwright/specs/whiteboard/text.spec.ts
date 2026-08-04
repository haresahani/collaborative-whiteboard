import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Text Tool", () => {
  test("Inserts text on the canvas", async ({ boardPage }) => {
    await boardPage.goto("text-board");
    await boardPage.toolbar.selectText();
    await boardPage.canvas.clickAt(300, 300);
    await boardPage.page.keyboard.type("Playwright E2E Text");
  });
});
