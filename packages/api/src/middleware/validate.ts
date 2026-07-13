import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Express middleware that validates the incoming request body against a Zod schema.
 * If validation fails, it returns a 400 Bad Request response with structured error messages.
 * If validation succeeds, it overwrites req.body with the validated (and stripped) data and continues.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Populate req.body with the sanitized and validated data
    req.body = result.data;
    next();
  };
};
