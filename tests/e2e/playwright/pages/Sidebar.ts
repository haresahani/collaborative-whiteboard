import { Page, Locator } from "@playwright/test";

export class Sidebar {
  readonly presenceList: Locator;
  readonly layersPanel: Locator;

  constructor(public readonly page: Page) {
    this.presenceList = page.locator(
      '.presence-avatars, [data-testid="presence-list"]',
    );
    this.layersPanel = page.locator(
      '.layers-panel, [data-testid="layers-panel"]',
    );
  }
}
