import { test, expect } from "../../fixtures/test.js";

test.describe("Accessibility - ARIA Roles & Labels", () => {
  test("Canvas and toolbar elements contain proper accessibility attributes", async ({
    boardPage,
  }) => {
    await boardPage.goto("aria-a11y-board");
    await boardPage.assertLoaded();
  });
});
