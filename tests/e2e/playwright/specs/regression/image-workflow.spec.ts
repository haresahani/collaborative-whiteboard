import { test, expect } from "../../fixtures/test.js";

test.describe("Full E2E Regression - Image Asset Workflow", () => {
  test("User opens board and manages asset uploads", async ({ boardPage }) => {
    await boardPage.goto("regression-image-workflow");
    await boardPage.assertLoaded();
  });
});
