import { Page, Locator } from "@playwright/test";

export class SignupPage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signupButton: Locator;

  constructor(public readonly page: Page) {
    this.nameInput = page.locator(
      'input[name="name"], input[name="displayName"]',
    );
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.signupButton = page.locator(
      'button[type="submit"], button:has-text("Sign Up")',
    );
  }

  async goto() {
    await this.page.goto("/board/local-board");
  }

  async signup(name: string, email: string, pass: string) {
    if (await this.nameInput.isVisible()) {
      await this.nameInput.fill(name);
      await this.emailInput.fill(email);
      await this.passwordInput.fill(pass);
      await this.signupButton.click();
    }
  }
}
