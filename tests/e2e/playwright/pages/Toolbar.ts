import { Page, Locator } from "@playwright/test";

export class Toolbar {
  readonly penTool: Locator;
  readonly rectangleTool: Locator;
  readonly circleTool: Locator;
  readonly arrowTool: Locator;
  readonly textTool: Locator;
  readonly stickyTool: Locator;
  readonly selectTool: Locator;
  readonly undoButton: Locator;
  readonly redoButton: Locator;

  constructor(public readonly page: Page) {
    this.penTool = page
      .locator(
        'button[title*="Pen"], button[aria-label*="Pen"], [data-tool="pen"]',
      )
      .first();
    this.rectangleTool = page
      .locator(
        'button[title*="Rectangle"], button[aria-label*="Rectangle"], [data-tool="rectangle"]',
      )
      .first();
    this.circleTool = page
      .locator(
        'button[title*="Circle"], button[aria-label*="Circle"], [data-tool="circle"]',
      )
      .first();
    this.arrowTool = page
      .locator(
        'button[title*="Arrow"], button[aria-label*="Arrow"], [data-tool="arrow"]',
      )
      .first();
    this.textTool = page
      .locator(
        'button[title*="Text"], button[aria-label*="Text"], [data-tool="text"]',
      )
      .first();
    this.stickyTool = page
      .locator(
        'button[title*="Sticky"], button[aria-label*="Sticky"], [data-tool="sticky"]',
      )
      .first();
    this.selectTool = page
      .locator(
        'button[title*="Select"], button[aria-label*="Select"], [data-tool="select"]',
      )
      .first();
    this.undoButton = page
      .locator('button[title*="Undo"], button[aria-label*="Undo"]')
      .first();
    this.redoButton = page
      .locator('button[title*="Redo"], button[aria-label*="Redo"]')
      .first();
  }

  async selectPen() {
    if (await this.penTool.isVisible()) await this.penTool.click();
  }

  async selectRectangle() {
    if (await this.rectangleTool.isVisible()) await this.rectangleTool.click();
  }

  async selectCircle() {
    if (await this.circleTool.isVisible()) await this.circleTool.click();
  }

  async selectArrow() {
    if (await this.arrowTool.isVisible()) await this.arrowTool.click();
  }

  async selectText() {
    if (await this.textTool.isVisible()) await this.textTool.click();
  }

  async selectSticky() {
    if (await this.stickyTool.isVisible()) await this.stickyTool.click();
  }

  async selectSelection() {
    if (await this.selectTool.isVisible()) await this.selectTool.click();
  }

  async clickUndo() {
    if (
      (await this.undoButton.isVisible()) &&
      (await this.undoButton.isEnabled())
    ) {
      await this.undoButton.click();
    } else {
      await this.page.keyboard.press("Control+z");
    }
  }

  async clickRedo() {
    if (
      (await this.redoButton.isVisible()) &&
      (await this.redoButton.isEnabled())
    ) {
      await this.redoButton.click();
    } else {
      await this.page.keyboard.press("Control+Shift+Z");
    }
  }
}
