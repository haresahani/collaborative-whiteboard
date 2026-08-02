import { z } from "zod";

export const cursorMoveSchema = z.object({
  x: z.number({ required_error: "x coordinate is required" }),
  y: z.number({ required_error: "y coordinate is required" }),
  previewElement: z.any().optional(),
  erasedIds: z.array(z.string()).optional(),
  tool: z.string().optional(),
});

export const cursorBatchEntrySchema = cursorMoveSchema.extend({
  userId: z.string().optional(),
  displayName: z.string().optional(),
});

export const cursorBatchSchema = z.object({
  cursors: z.array(cursorBatchEntrySchema),
});

export const chatSendSchema = z.object({
  message: z
    .string({ required_error: "Message is required" })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: "Message cannot be empty" })
    .refine((val) => val.length <= 2000, {
      message: "Message must be 2000 characters or fewer",
    }),
  messageId: z.string().uuid().optional(),
});

export type CursorMove = z.infer<typeof cursorMoveSchema>;
export type CursorBatchEntry = z.infer<typeof cursorBatchEntrySchema>;
export type CursorBatch = z.infer<typeof cursorBatchSchema>;
export type ChatSend = z.infer<typeof chatSendSchema>;
