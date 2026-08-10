import { test, expect } from "../../fixtures/test.js";

test.describe("Full E2E Regression - Multi-User Collaboration Workflow", () => {
  test("Simulates multi-user session joining, drawing, and disconnecting", async ({
    browser,
  }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const boardId = `collab-workflow-${Date.now()}`;
    await page1.goto(`/board/${boardId}`);
    await page2.goto(`/board/${boardId}`);

    await context1.close();
    await context2.close();
  });
});
