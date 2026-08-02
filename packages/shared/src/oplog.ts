import { z } from "zod";
import {
  compareLamportClientId,
  filterUpdatesForGroup,
  getTouchedFieldGroups,
  type GroupClock,
  type ILastUpdateState,
} from "./utils/lww";

export const OpTypeSchema = z.enum([
  "stroke.commit",
  "element.create",
  "element.update",
  "element.delete",
  "sticky.textUpdate",
  "op.undo",
  "op.redo",
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
  tombstoned?: boolean;
  lastUpdate?: ILastUpdateState;
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

  if (op.type === "sticky.textUpdate") {
    // Text updates are managed by Yjs CRDT and handled out-of-band for canvas elements
    return elements;
  }

  if (op.type === "stroke.commit") {
    // Prevent duplicate strokes (idempotency)
    const exists = elements.some((el) => el.id === opId);
    if (exists) {
      return elements.map((el) =>
        el.id === opId ? { ...el, tombstoned: false } : el,
      );
    }

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
      tombstoned: false,
      createdAt: new Date(op.createdAt).getTime(),
      updatedAt: new Date(op.createdAt).getTime(),
    };
    return [...elements, newStroke];
  }

  if (op.type === "element.create") {
    const el = op.payload.element as ISharedElement | undefined;
    if (!el || !el.id) return elements;

    const exists = elements.some((existing) => existing.id === el.id);
    if (exists) {
      return elements.map((existing) =>
        existing.id === el.id ? { ...existing, tombstoned: false } : existing,
      );
    }

    return [...elements, { ...el, tombstoned: false }];
  }

  if (op.type === "element.update") {
    const id = (op.payload.id || op.payload.elementId) as string | undefined;
    const updates = op.payload.updates as Record<string, unknown> | undefined;
    if (!id || !updates) return elements;

    const incomingClock: GroupClock = {
      lamport: op.lamport,
      clientId: op.actorId,
    };

    const touchedGroups = getTouchedFieldGroups(updates);

    return elements.map((el) => {
      if (el.id !== id) return el;

      const lastUpdate: ILastUpdateState = { ...(el.lastUpdate || {}) };
      let updatedElement: ISharedElement = { ...el };
      let updatedAnyGroup = false;

      for (const group of touchedGroups) {
        const existingClock = lastUpdate[group];
        const groupWins =
          !existingClock ||
          compareLamportClientId(incomingClock, existingClock) >= 0;

        if (groupWins) {
          const groupUpdates = filterUpdatesForGroup(updates, group);
          updatedElement = { ...updatedElement, ...groupUpdates };
          lastUpdate[group] = incomingClock;
          updatedAnyGroup = true;
        }
      }

      if (updatedAnyGroup) {
        updatedElement.lastUpdate = lastUpdate;
        updatedElement.updatedAt = new Date(op.createdAt).getTime();
      }

      return updatedElement;
    });
  }

  if (op.type === "element.delete") {
    const id = (op.payload.id || op.payload.elementId) as string | undefined;
    if (!id) return elements;

    // Soft delete via tombstone flag
    return elements.map((el) =>
      el.id === id ? { ...el, tombstoned: true } : el,
    );
  }

  if (op.type === "op.undo") {
    const targetOpId = op.payload.targetOpId as string | undefined;
    const targetOpType = op.payload.targetOpType as string | undefined;
    const targetLamport = op.payload.targetLamport as number | undefined;
    const tombstoneId = (op.payload.tombstoneId || targetOpId) as
      | string
      | undefined;
    const inversePayload = op.payload.inversePayload as
      | {
          restoredElement?: ISharedElement;
          inverseUpdates?: Record<string, unknown>;
        }
      | undefined;

    if (!targetOpId) return elements;

    const targetElId =
      tombstoneId || (inversePayload?.restoredElement?.id as string);

    // [FIX 4] Conflict check: if element has been touched by a higher Lamport clock from another client, reject/skip undo
    if (targetElId && typeof targetLamport === "number") {
      const existingEl = elements.find((el) => el.id === targetElId);
      if (existingEl?.lastUpdate) {
        const hasConflict = Object.values(existingEl.lastUpdate).some(
          (clock) =>
            clock.lamport > targetLamport && clock.clientId !== op.actorId,
        );
        if (hasConflict) {
          console.warn(
            `[oplog] op.undo rejected for op ${targetOpId}: element ${targetElId} has newer concurrent edits`,
          );
          return elements;
        }
      }
    }

    if (
      targetOpType === "element.delete" ||
      (inversePayload && inversePayload.restoredElement)
    ) {
      // Undoing a delete: restore element
      const restored = inversePayload?.restoredElement;
      if (targetElId && elements.some((el) => el.id === targetElId)) {
        return elements.map((el) =>
          el.id === targetElId ? { ...el, tombstoned: false } : el,
        );
      } else if (restored) {
        return [...elements, { ...restored, tombstoned: false }];
      }
    }

    if (
      targetOpType === "element.update" &&
      inversePayload?.inverseUpdates &&
      targetElId
    ) {
      // Undoing an update: apply inverseUpdates
      return elements.map((el) => {
        if (el.id !== targetElId) return el;
        return { ...el, ...inversePayload.inverseUpdates };
      });
    }

    // Default for creation/stroke: mark element tombstoned
    if (targetElId) {
      return elements.map((el) =>
        el.id === targetElId ? { ...el, tombstoned: true } : el,
      );
    }

    return elements;
  }

  if (op.type === "op.redo") {
    const targetOpId = op.payload.targetOpId as string | undefined;
    const targetOpType = op.payload.targetOpType as string | undefined;
    const tombstoneId = (op.payload.tombstoneId || targetOpId) as
      | string
      | undefined;
    const inversePayload = op.payload.inversePayload as
      | {
          restoredElement?: ISharedElement;
          inverseUpdates?: Record<string, unknown>;
          forwardUpdates?: Record<string, unknown>;
        }
      | undefined;

    const targetElId = tombstoneId || (op.payload.elementId as string);
    if (!targetElId) return elements;

    if (targetOpType === "element.delete") {
      // Redo deletion: tombstone again
      return elements.map((el) =>
        el.id === targetElId ? { ...el, tombstoned: true } : el,
      );
    }

    if (
      targetOpType === "element.update" &&
      inversePayload?.forwardUpdates &&
      targetElId
    ) {
      // Redo an update: re-apply forwardUpdates
      return elements.map((el) => {
        if (el.id !== targetElId) return el;
        return { ...el, ...inversePayload.forwardUpdates, tombstoned: false };
      });
    }

    // Redo creation/stroke: untombstone element
    return elements.map((el) =>
      el.id === targetElId ? { ...el, tombstoned: false } : el,
    );
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
