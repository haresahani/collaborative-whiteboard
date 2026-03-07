import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 minutes
  max: 100, //limit each IP to 100 requests
  message: {
    message: "Too many requests, please try again later",
  },
});
