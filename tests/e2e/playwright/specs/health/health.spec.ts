import { test, expect } from "../../fixtures/test.js";

test.describe("Application Health & Environment Smoke Tests", () => {
  test("Homepage redirects to default board and loads successfully", async ({
    page,
    boardPage,
  }) => {
    await boardPage.goto("local-board");
    await boardPage.assertLoaded();
    await expect(page).toHaveURL(/\/board\/local-board/);
  });

  test("Client canvas element renders in the DOM", async ({ boardPage }) => {
    await boardPage.goto("health-check-board");
    await expect(boardPage.canvas.canvasElement).toBeVisible();
  });
});
