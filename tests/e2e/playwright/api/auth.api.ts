import { APIRequestContext } from "@playwright/test";

export class AuthApi {
  constructor(private request: APIRequestContext) {}

  async login(email: string, pass: string) {
    return this.request.post("/api/auth/login", {
      data: { email, password: pass },
    });
  }

  async register(email: string, pass: string, name: string) {
    return this.request.post("/api/auth/register", {
      data: { email, password: pass, displayName: name },
    });
  }
}
