import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(public readonly page: Page) {
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator(
      'input[type="password"], input[name="password"]',
    );
    this.loginButton = page.locator(
      'button[type="submit"], button:has-text("Log In")',
    );
    this.errorMessage = page.locator('.error-message, [role="alert"]');
  }

  async goto() {
    await this.page.goto("/board/local-board");
  }

  async login(email: string, pass: string) {
    if (await this.emailInput.isVisible()) {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(pass);
      await this.loginButton.click();
    }
  }

  async assertErrorVisible() {
    if (await this.errorMessage.isVisible()) {
      await expect(this.errorMessage).toBeVisible();
    }
  }
}
