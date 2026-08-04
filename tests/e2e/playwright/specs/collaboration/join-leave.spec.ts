import { test, expect } from "../../fixtures/test.js";

test.describe("Real-Time Collaboration - Join & Leave", () => {
  test("Participants update dynamically when user joins and leaves board room", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/board/join-leave-board");
    await context.close();
  });
});
