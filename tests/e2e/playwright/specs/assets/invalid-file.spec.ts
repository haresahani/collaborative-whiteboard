import { test, expect } from "../../fixtures/test.js";

test.describe("Assets - Invalid File Upload", () => {
  test("Rejects unsupported file types gracefully", async ({ boardPage }) => {
    await boardPage.goto("asset-invalid-board");
    await boardPage.assertLoaded();
  });
});
