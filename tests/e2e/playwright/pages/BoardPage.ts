import { Page, Locator, expect } from "@playwright/test";
import { Toolbar } from "./Toolbar.js";
import { Canvas } from "./Canvas.js";
import { Sidebar } from "./Sidebar.js";

export class BoardPage {
  readonly toolbar: Toolbar;
  readonly canvas: Canvas;
  readonly sidebar: Sidebar;
  readonly boardTitle: Locator;

  constructor(public readonly page: Page) {
    this.toolbar = new Toolbar(page);
    this.canvas = new Canvas(page);
    this.sidebar = new Sidebar(page);
    this.boardTitle = page.locator(
      '[data-testid="board-title"], .board-title, input[aria-label="Board title"]',
    );
  }

  async goto(boardId = "local-board") {
    await this.page.goto(`/board/${boardId}`);
    await this.canvas.waitForReady();
  }

  async renameBoard(newName: string) {
    await this.boardTitle.click();
    await this.boardTitle.fill(newName);
    await this.page.keyboard.press("Enter");
  }

  async assertLoaded() {
    await expect(this.canvas.canvasElement).toBeVisible();
  }
}
