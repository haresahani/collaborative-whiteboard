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

export interface ISharedElement {
  id: string;
  type: string;
  [key: string]: unknown;
}

/**
 * Idempotently applies a single committed operation to a list of whiteboard elements.
 * This is used on both client and server to keep their representation in sync.
 */
export function applyOperation(
  elements: ISharedElement[],
  op: IOp,
): ISharedElement[] {
  const opId = op.opId;

  if (op.type === "stroke.commit") {
    // Prevent duplicate strokes (idempotency)
    const exists = elements.some((el) => el.id === opId);
    if (exists) return elements;

    const strokeData = op.payload.stroke as
      | {
          points: [number, number][];
          color: string;
          width: number;
          tool: "pen" | "eraser";
        }
      | undefined;

    if (!strokeData || !strokeData.points) return elements;

    const firstPt = strokeData.points[0] || [0, 0];
    const newStroke: ISharedElement = {
      id: opId,
      type: "stroke",
      x: firstPt[0],
      y: firstPt[1],
      points: strokeData.points.map(([x, y]) => ({ x, y })),
      style: {
        strokeColor: strokeData.color,
        strokeWidth: strokeData.width,
      },
      zIndex: 0,
      createdAt: new Date(op.createdAt).getTime(),
      updatedAt: new Date(op.createdAt).getTime(),
    };
    return [...elements, newStroke];
  }

  if (op.type === "element.create") {
    const el = op.payload.element as ISharedElement | undefined;
    if (!el || !el.id) return elements;

    const exists = elements.some((existing) => existing.id === el.id);
    if (exists) return elements;

    return [...elements, el];
  }

  if (op.type === "element.update") {
    const id = (op.payload.id || op.payload.elementId) as string | undefined;
    const updates = op.payload.updates as Partial<ISharedElement> | undefined;
    if (!id || !updates) return elements;

    return elements.map((el) => {
      if (el.id === id) {
        return {
          ...el,
          ...updates,
          updatedAt: new Date(op.createdAt).getTime(),
        };
      }
      return el;
    });
  }

  if (op.type === "element.delete") {
    const id = (op.payload.id || op.payload.elementId) as string | undefined;
    if (!id) return elements;

    return elements.filter((el) => el.id !== id);
  }

  return elements;
}

/**
 * Replays a list of operations sequentially onto a base list of whiteboard elements.
 * Sorts operations deterministically by (lamport logical clock, opId uuid).
 */
export function replayOperations(
  elements: ISharedElement[],
  oplogs: IOp[],
): ISharedElement[] {
  // Deterministic sort: secondary sorting key opId resolves concurrent same-lamport operations.
  const sortedOplogs = [...oplogs].sort((a, b) => {
    if (a.lamport !== b.lamport) {
      return a.lamport - b.lamport;
    }
    return a.opId.localeCompare(b.opId);
  });

  let state = elements;
  for (const op of sortedOplogs) {
    state = applyOperation(state, op);
  }
  return state;
}
