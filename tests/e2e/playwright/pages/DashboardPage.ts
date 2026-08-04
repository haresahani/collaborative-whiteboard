import { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly createBoardButton: Locator;
  readonly boardList: Locator;

  constructor(public readonly page: Page) {
    this.createBoardButton = page.locator(
      'button:has-text("New Board"), button:has-text("Create Board")',
    );
    this.boardList = page.locator('.board-card, [data-testid="board-card"]');
  }

  async goto() {
    await this.page.goto("/board/local-board");
  }

  async createBoard() {
    if (await this.createBoardButton.isVisible()) {
      await this.createBoardButton.click();
    }
  }
}
