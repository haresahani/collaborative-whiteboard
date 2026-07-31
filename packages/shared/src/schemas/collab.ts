import { z } from "zod";

export const cursorMoveSchema = z.object({
  x: z.number({ required_error: "x coordinate is required" }),
  y: z.number({ required_error: "y coordinate is required" }),
  previewElement: z.any().optional(),
  erasedIds: z.array(z.string()).optional(),
});

export const chatSendSchema = z.object({
  message: z
    .string({ required_error: "Message is required" })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: "Message cannot be empty" })
    .refine((val) => val.length <= 2000, {
      message: "Message must be 2000 characters or fewer",
    }),
});

export type CursorMove = z.infer<typeof cursorMoveSchema>;
export type ChatSend = z.infer<typeof chatSendSchema>;
