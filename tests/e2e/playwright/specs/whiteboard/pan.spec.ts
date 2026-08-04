import { test, expect } from "../../fixtures/test.js";

test.describe("Whiteboard Canvas - Pan Tool", () => {
  test("Pans canvas viewport via spacebar drag", async ({
    boardPage,
    page,
  }) => {
    await boardPage.goto("pan-board");
    await page.keyboard.down("Space");
    await boardPage.canvas.drawStroke(200, 200, 400, 400);
    await page.keyboard.up("Space");
  });
});
