import { APIRequestContext } from "@playwright/test";

export class BoardsApi {
  constructor(private request: APIRequestContext) {}

  async createBoard(name: string) {
    return this.request.post("/api/boards", {
      data: { title: name },
    });
  }

  async getBoard(boardId: string) {
    return this.request.get(`/api/boards/${boardId}`);
  }

  async deleteBoard(boardId: string) {
    return this.request.delete(`/api/boards/${boardId}`);
  }
}
