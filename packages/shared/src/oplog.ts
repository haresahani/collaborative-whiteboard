import { z } from "zod";

export const OpTypeSchema = z.enum([
  "stroke.commit",
  "element.create",
  "element.update",
  "element.delete",
]);

export const OpSchema = z.object({
  opId: z.string().uuid(),
  boardId: z.string(),
  type: OpTypeSchema,
  payload: z.record(z.unknown()),
  actorId: z.string(),
  lamport: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export type IOp = z.infer<typeof OpSchema>;
