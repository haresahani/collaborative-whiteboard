import type { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

const isTest = process.env.NODE_ENV === "test";

export const authRateLimiterMemory = new RateLimiterMemory({
  points: isTest ? 1000 : 10,
  duration: 60,
});

export const boardMutationRateLimiterMemory = new RateLimiterMemory({
  points: isTest ? 1000 : 30,
  duration: 60,
});

export const globalRateLimiterMemory = new RateLimiterMemory({
  points: isTest ? 10000 : 100,
  duration: 60,
});

export function createExpressRateLimiter(limiter: RateLimiterMemory) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.user?.id || req.ip || "127.0.0.1";
      await limiter.consume(key);
      next();
    } catch {
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
      });
    }
  };
}

export const authLimiter = createExpressRateLimiter(authRateLimiterMemory);
export const boardMutationLimiter = createExpressRateLimiter(
  boardMutationRateLimiterMemory,
);
export const globalLimiter = createExpressRateLimiter(globalRateLimiterMemory);

export const rateLimiter = globalLimiter;
