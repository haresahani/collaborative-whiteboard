import { test, expect } from "../../fixtures/test.js";

test.describe("Accessibility - Keyboard Navigation", () => {
  test("Navigates whiteboard toolbar controls via Tab key", async ({
    page,
    boardPage,
  }) => {
    await boardPage.goto("keyboard-a11y-board");
    await page.keyboard.press("Tab");
  });
});
