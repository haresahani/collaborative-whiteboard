import { Page, Locator, expect } from "@playwright/test";

export class Canvas {
  readonly canvasElement: Locator;

  constructor(public readonly page: Page) {
    this.canvasElement = page.locator("canvas").first();
  }

  async waitForReady() {
    await this.canvasElement.waitFor({ state: "visible", timeout: 15_000 });
  }

  async drawStroke(startX = 300, startY = 300, endX = 450, endY = 450) {
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY, { steps: 2 });
    await this.page.mouse.up();
  }

  async drawRectangle(startX = 200, startY = 200, width = 150, height = 100) {
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + width, startY + height, { steps: 2 });
    await this.page.mouse.up();
  }

  async clickAt(x: number, y: number) {
    await this.page.mouse.click(x, y);
  }

  async zoomIn() {
    await this.page.keyboard.press("Control+=");
  }

  async zoomOut() {
    await this.page.keyboard.press("Control+-");
  }
}
