import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/server";

describe("API Security Headers & CORS Tests", () => {
  it("should return Helmet security headers on GET /", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["cross-origin-resource-policy"]).toBe(
      "cross-origin",
    );
  });

  it("should include CORS headers for requests", async () => {
    const response = await request(app)
      .get("/")
      .set("Origin", "http://localhost:5173");

    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });
});
