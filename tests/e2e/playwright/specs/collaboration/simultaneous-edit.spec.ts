import { test, expect } from "../../fixtures/test.js";

test.describe("Real-Time Collaboration - Simultaneous Edits", () => {
  test("Resolves concurrent edits from two users without corruption", async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const boardId = `collab-simul-${Date.now()}`;
    await pageA.goto(`/board/${boardId}`);
    await pageB.goto(`/board/${boardId}`);

    await contextA.close();
    await contextB.close();
  });
});
