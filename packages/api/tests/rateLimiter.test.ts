import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { createExpressRateLimiter } from "../src/middleware/rateLimiter";

describe("Rate Limiter Middleware Tests", () => {
  it("should block requests with 429 after rate limit threshold is exceeded", async () => {
    const testLimiter = new RateLimiterMemory({
      points: 2,
      duration: 60,
    });

    const testApp = express();
    testApp.use(createExpressRateLimiter(testLimiter));
    testApp.get("/test-limit", (req, res) => {
      res.status(200).json({ ok: true });
    });

    const res1 = await request(testApp).get("/test-limit");
    expect(res1.status).toBe(200);

    const res2 = await request(testApp).get("/test-limit");
    expect(res2.status).toBe(200);

    const res3 = await request(testApp).get("/test-limit");
    expect(res3.status).toBe(429);
    expect(res3.body).toEqual({
      success: false,
      message: "Too many requests, please try again later",
    });
  });
});
