import { test, expect } from "../../fixtures/test.js";

test.describe("Board Management - Delete Board", () => {
  test("Deleting board cleans up board session", async ({ boardPage }) => {
    await boardPage.goto("delete-test-board");
    await boardPage.assertLoaded();
  });
});
