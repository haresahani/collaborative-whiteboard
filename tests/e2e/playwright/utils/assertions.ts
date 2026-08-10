import { expect, Locator, Page } from "@playwright/test";

export async function assertCanvasVisible(page: Page): Promise<void> {
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
}

export async function assertElementExists(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
}
