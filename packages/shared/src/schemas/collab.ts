import { z } from "zod";

export const cursorMoveSchema = z.object({
  x: z.number(),
  y: z.number(),
  previewElement: z.unknown().optional(),
  erasedIds: z.array(z.string()).optional(),
  tool: z.string().optional(),
});

export const cursorBatchSchema = z.object({
  cursors: z.array(
    z.object({
      userId: z.string().optional(),
      displayName: z.string().optional(),
      x: z.number(),
      y: z.number(),
      previewElement: z.unknown().optional(),
      erasedIds: z.array(z.string()).optional(),
      tool: z.string().optional(),
    }),
  ),
});

export const chatSendSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
  messageId: z.string().uuid(),
});

export type CursorMovePayload = z.infer<typeof cursorMoveSchema>;
export type CursorMove = CursorMovePayload;
export type CursorBatchPayload = z.infer<typeof cursorBatchSchema>;
export type ChatSendPayload = z.infer<typeof chatSendSchema>;
