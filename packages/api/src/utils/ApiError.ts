/**
 * Custom API error class that carries HTTP semantics.
 *
 * Thrown from services / business logic so they can signal errors
 * without knowing about Express req/res objects.
 * Caught by the centralized `errorHandler` middleware.
 *
 * @example
 * throw new ApiError(404, "Board not found");
 * throw ApiError.badRequest("Invalid input", validationErrors);
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;

    // Preserve proper stack trace in V8 engines (Node.js)
    Error.captureStackTrace(this, this.constructor);
  }

  /** 400 Bad Request */
  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  /** 401 Unauthorized */
  static unauthorized(message: string): ApiError {
    return new ApiError(401, message);
  }

  /** 403 Forbidden */
  static forbidden(message: string): ApiError {
    return new ApiError(403, message);
  }

  /** 404 Not Found */
  static notFound(message: string): ApiError {
    return new ApiError(404, message);
  }

  /** 409 Conflict */
  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  /** 500 Internal Server Error */
  static internal(message: string): ApiError {
    return new ApiError(500, message);
  }
}
