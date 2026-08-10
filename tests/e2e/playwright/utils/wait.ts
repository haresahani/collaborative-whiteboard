import { Page, Locator } from "@playwright/test";

export async function waitForCanvasReady(
  page: Page,
  canvasLocator?: Locator,
): Promise<void> {
  const canvas = canvasLocator || page.locator("canvas").first();
  await canvas.waitFor({ state: "visible", timeout: 10_000 });
}

export async function waitMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
