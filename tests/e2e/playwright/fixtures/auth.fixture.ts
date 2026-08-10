import { test as base } from "@playwright/test";

export type AuthFixtures = {
  authenticatedUser: { email: string; token: string };
  guestUser: { userId: string };
};

export const authFixtures = base.extend<AuthFixtures>({
  authenticatedUser: async ({}, use) => {
    await use({
      email: "e2e_authenticated@example.com",
      token: "mock_jwt_token_for_e2e_testing",
    });
  },
  guestUser: async ({}, use) => {
    await use({
      userId: `guest_${Date.now()}`,
    });
  },
});
