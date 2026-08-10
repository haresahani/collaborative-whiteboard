import { test, expect } from "../../fixtures/test.js";

test.describe("Real-Time Collaboration - Cursors", () => {
  test("User cursor movements are broadcasted to other participants", async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const boardId = `collab-cursor-${Date.now()}`;
    await pageA.goto(`/board/${boardId}`);
    await pageB.goto(`/board/${boardId}`);

    await pageA.mouse.move(300, 300);

    await contextA.close();
    await contextB.close();
  });
});
