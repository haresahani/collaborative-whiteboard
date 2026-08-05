import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 100_000, // 100 in production, 100k in dev/test
  message: {
    message: "Too many requests, please try again later",
  },
});
