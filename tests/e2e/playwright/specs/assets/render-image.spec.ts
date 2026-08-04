import { test, expect } from "../../fixtures/test.js";

test.describe("Assets - Render Image", () => {
  test("Uploaded image renders on canvas view", async ({ boardPage }) => {
    await boardPage.goto("asset-render-board");
    await boardPage.assertLoaded();
  });
});
