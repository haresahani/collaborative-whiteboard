import { test as base } from "@playwright/test";
import { BoardPage } from "../pages/BoardPage.js";
import { LoginPage } from "../pages/LoginPage.js";
import { SignupPage } from "../pages/SignupPage.js";
import { DashboardPage } from "../pages/DashboardPage.js";
import { Toolbar } from "../pages/Toolbar.js";
import { Canvas } from "../pages/Canvas.js";

export type CustomFixtures = {
  boardPage: BoardPage;
  loginPage: LoginPage;
  signupPage: SignupPage;
  dashboardPage: DashboardPage;
  toolbar: Toolbar;
  canvas: Canvas;
};

export const test = base.extend<CustomFixtures>({
  boardPage: async ({ page }, use) => {
    const boardPage = new BoardPage(page);
    await use(boardPage);
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  signupPage: async ({ page }, use) => {
    const signupPage = new SignupPage(page);
    await use(signupPage);
  },
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
  toolbar: async ({ page }, use) => {
    const toolbar = new Toolbar(page);
    await use(toolbar);
  },
  canvas: async ({ page }, use) => {
    const canvas = new Canvas(page);
    await use(canvas);
  },
});

export { expect } from "@playwright/test";
