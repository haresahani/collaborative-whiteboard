import { test as base } from "@playwright/test";

export type BoardFixtures = {
  testBoardId: string;
};

export const boardFixtures = base.extend<BoardFixtures>({
  testBoardId: async ({}, use) => {
    const boardId = `board_e2e_${Date.now()}`;
    await use(boardId);
  },
});
