import { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError";

/**
 * Centralized Express error-handling middleware.
 *
 * This is the single place that converts any thrown error into a
 * structured JSON response. It handles:
 *
 * 1. ApiError       — our custom errors (use statusCode + message)
 * 2. Mongoose       — ValidationError, CastError, duplicate-key (11000)
 * 3. Unknown errors — 500 with a generic message (no stack leaks)
 *
 * Must be registered AFTER all routes in server.ts.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  //1. Our own ApiError
  if (err instanceof ApiError) {
    const body: Record<string, unknown> = {
      success: false,
      message: err.message,
    };

    if (err.details) {
      body.errors = err.details;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  //2. Mongoose ValidationError
  if (err.name === "ValidationError" && err.errors) {
    const errors = Object.values(
      err.errors as Record<string, { message: string; path: string }>,
    ).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  //3. Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
    return;
  }

  //4. MongoDB duplicate key (code 11000)
  if (err.code === 11000) {
    res.status(409).json({
      success: false,
      message: "Resource already exists",
    });
    return;
  }

  //5. Unknown / unexpected errors
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
};
