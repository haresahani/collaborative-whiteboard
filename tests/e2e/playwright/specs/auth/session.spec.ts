import { test, expect } from "../../fixtures/test.js";

test.describe("Authentication - Session Persistence", () => {
  test("Session persists across page reloads", async ({ page, boardPage }) => {
    await boardPage.goto("session-test-board");
    await page.reload();
    await boardPage.assertLoaded();
  });
});
