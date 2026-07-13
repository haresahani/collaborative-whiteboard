import { z } from "zod";

/**
 * Zod validation schemas for board endpoints.
 *
 * These schemas define the contract for incoming request bodies.
 * The `validate` middleware runs them before controllers execute,
 * ensuring only clean, typed data reaches business logic.
 */

/** POST /api/boards — create a new board. */
export const createBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title must be under 100 characters")
    .optional(),

  visibility: z.enum(["private", "public"]).optional(),
});

/** Inferred DTO type for service layer consumption. */
export type CreateBoardDto = z.infer<typeof createBoardSchema>;
