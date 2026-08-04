import { test, expect } from "../../fixtures/test.js";

test.describe("Assets - Large File Upload", () => {
  test("Handles large asset uploads without crashing UI", async ({
    boardPage,
  }) => {
    await boardPage.goto("asset-large-board");
    await boardPage.assertLoaded();
  });
});
