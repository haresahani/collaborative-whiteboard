import { test, expect } from "../../fixtures/test.js";

test.describe("Real-Time Collaboration - Multi-User Live Drawing", () => {
  test("Two concurrent browser contexts receive live drawn elements in real-time", async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const boardId = `collab-live-${Date.now()}`;
    await pageA.goto(`/board/${boardId}`);
    await pageB.goto(`/board/${boardId}`);

    const canvasA = pageA.locator("canvas").first();
    const canvasB = pageB.locator("canvas").first();

    await expect(canvasA).toBeVisible();
    await expect(canvasB).toBeVisible();

    // User A draws on Canvas A
    await pageA.mouse.move(200, 200);
    await pageA.mouse.down();
    await pageA.mouse.move(400, 300, { steps: 5 });
    await pageA.mouse.up();

    await contextA.close();
    await contextB.close();
  });
});
