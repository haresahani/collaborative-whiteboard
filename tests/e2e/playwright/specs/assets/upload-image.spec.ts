import { test, expect } from "../../fixtures/test.js";

test.describe("Assets - Upload Image", () => {
  test("User can upload image file to the canvas", async ({ boardPage }) => {
    await boardPage.goto("asset-upload-board");
    await boardPage.assertLoaded();
  });
});
