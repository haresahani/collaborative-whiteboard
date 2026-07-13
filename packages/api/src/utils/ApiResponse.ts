import { Response } from "express";

/**
 * Standardised API response helpers.
 *
 * Every endpoint returns one of two shapes:
 *
 * Success → { success: true,  data: T }
 * Error   → { success: false, message: string, errors?: unknown }
 *
 * Controllers use these helpers instead of calling `res.json()` directly,
 * ensuring a consistent response contract across the entire API.
 */
export class ApiResponse {
  /** 200 — Generic success with data payload. */
  static success<T>(res: Response, data: T, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /** 201 Resource created successfully. */
  static created<T>(res: Response, data: T): Response {
    return res.status(201).json({
      success: true,
      data,
    });
  }

  /** Success with a message string instead of a data payload. */
  static message(res: Response, message: string, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      message,
    });
  }
}
