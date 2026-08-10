/**
 * Lightweight chat send schema compatible with zod API.
 * Uses the client's zod instance by re-exporting a factory so the
 * schema is created in the consumer context.
 */

// This file is consumed by the client which has zod available.
// We export a function that builds the schema to avoid a hard zod dependency in shared.
export function buildChatSendSchema(z: {
  object: (shape: Record<string, unknown>) => unknown;
  string: () => {
    min: (
      n: number,
      msg: string,
    ) => { max: (n: number, msg: string) => unknown };
  };
}) {
  return z.object({
    message: z
      .string()
      .min(1, "Message cannot be empty")
      .max(2000, "Message too long"),
    messageId: (z as unknown as { string: () => { uuid: () => unknown } })
      .string()
      .uuid(),
  });
}

export type ChatSendPayload = {
  message: string;
  messageId: string;
};
