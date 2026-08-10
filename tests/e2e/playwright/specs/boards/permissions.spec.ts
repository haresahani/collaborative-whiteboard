import { test, expect } from "../../fixtures/test.js";

test.describe("Board Management - Permissions", () => {
  test("Guest users can access public whiteboard boards", async ({
    boardPage,
  }) => {
    await boardPage.goto("public-access-board");
    await boardPage.assertLoaded();
  });
});
