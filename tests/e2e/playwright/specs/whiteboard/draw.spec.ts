import { test, expect } from "../../fixtures/test.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("Whiteboard Canvas - Automatic Drawing", () => {
  test("Performs pen stroke draw action on the canvas and takes snapshot", async ({
    boardPage,
  }) => {
    await boardPage.goto("draw-e2e-board");
    await boardPage.toolbar.selectPen();
    await boardPage.canvas.drawStroke(250, 250, 450, 350);

    const screenshotsDir = path.resolve(__dirname, "../../screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotsDir, "draw-stroke.png");
    await boardPage.canvas.canvasElement.screenshot({
      path: screenshotPath,
      timeout: 5000,
    });
  });
});
