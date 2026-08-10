import { APIRequestContext } from "@playwright/test";

export class UsersApi {
  constructor(private request: APIRequestContext) {}

  async getProfile() {
    return this.request.get("/api/users/me");
  }
}
