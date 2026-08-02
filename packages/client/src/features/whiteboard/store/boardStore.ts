import { create } from "zustand";
import type { Element } from "../models/element";
import { useHistoryStore } from "./historyStore";
import { socketService } from "../../../api/ws";

type BoardState = {
  boardId: string | null;
  elements: Element[];

  setBoardId: (boardId: string) => void;

  /**
   * Replace the board with `elements`, recording the previous state in
   * history. Pass a `coalesceKey` when rapid successive commits belong to a
   * single gesture (e.g. dragging inside a color picker) so undo treats them
   * as one step. Pass `base` when the store already holds live (uncommitted)
   * frames of a gesture — e.g. a drag rendered via setElements — so the
   * history snapshot is the pre-gesture state instead of the last frame.
   */
  commit: (elements: Element[], coalesceKey?: string, base?: Element[]) => void;

  addElement: (element: Element) => void;
  addRemoteElement: (element: Element) => void;

  /** Replace the board WITHOUT recording history (live drag frames). */
  setElements: (elements: Element[]) => void;
  updateElement: (id: string, updater: (el: Element) => Element) => void;

  undo: () => void;
  redo: () => void;
};

export const useBoardStore = create<BoardState>((set, get) => ({
  boardId: null,
  elements: [],

  setBoardId: (boardId) => set({ boardId }),

  commit: (elements, coalesceKey, base) => {
    const current = get().elements;
    const snapshot = base ?? current;

    // Mutations return the same array reference when nothing changed;
    // skip those so no-ops never pollute the undo history.
    if (elements === snapshot) return;

    const historyOps: import("./historyStore").HistoryOpEntry[] = [];

    // Identify newly committed elements to emit to Socket.IO
    const addedElements = elements.filter(
      (el) => !snapshot.some((s) => s.id === el.id),
    );
    for (const el of addedElements) {
      if (el.type === "stroke") {
        socketService.emitStroke(el);
        historyOps.push({
          targetOpId: el.id,
          targetOpType: "stroke.commit",
          tombstoneId: el.id,
        });
      } else {
        socketService.emitOp("element.create", {
          element: el as unknown as Record<string, unknown>,
        });
        historyOps.push({
          targetOpId: el.id,
          targetOpType: "element.create",
          tombstoneId: el.id,
        });
      }
    }

    // Identify deleted elements to emit to Socket.IO
    const deletedElements = snapshot.filter(
      (s) => !elements.some((el) => el.id === s.id),
    );
    for (const el of deletedElements) {
      socketService.emitOp("element.delete", { id: el.id });
      historyOps.push({
        targetOpId: el.id,
        targetOpType: "element.delete",
        tombstoneId: el.id,
        inversePayload: {
          restoredElement: el as unknown as Record<string, unknown>,
        },
      });
    }

    // Identify updated elements to emit to Socket.IO
    const updatedElements = elements.filter((el) => {
      const prev = snapshot.find((s) => s.id === el.id);
      return (
        prev &&
        (prev.updatedAt !== el.updatedAt ||
          JSON.stringify(prev) !== JSON.stringify(el))
      );
    });
    for (const el of updatedElements) {
      const prev = snapshot.find((s) => s.id === el.id)!;
      const updates: Record<string, unknown> = {};
      const prevUpdates: Record<string, unknown> = {};
      const elRec = el as unknown as Record<string, unknown>;
      const prevRec = prev as unknown as Record<string, unknown>;
      for (const key of Object.keys(el)) {
        if (JSON.stringify(elRec[key]) !== JSON.stringify(prevRec[key])) {
          updates[key] = elRec[key];
          prevUpdates[key] = prevRec[key];
        }
      }
      if (Object.keys(updates).length > 0) {
        socketService.emitOp("element.update", { id: el.id, updates });
        historyOps.push({
          targetOpId: el.id,
          targetOpType: "element.update",
          tombstoneId: el.id,
          inversePayload: {
            inverseUpdates: prevUpdates,
          },
        });
      }
    }

    useHistoryStore
      .getState()
      .push(snapshot, coalesceKey, undefined, historyOps);

    if (elements !== current) {
      set({ elements });
    }
  },

  addElement: (element) => {
    get().commit([...get().elements, element]);
  },

  addRemoteElement: (element) => {
    const exists = get().elements.some((el) => el.id === element.id);
    if (exists) return;

    set({ elements: [...get().elements, element] });
  },

  setElements: (elements) => set({ elements }),

  updateElement: (id, updater) => {
    const prev = get().elements;
    const next = prev.map((el) => (el.id === id ? updater(el) : el));

    get().commit(next);
  },

  undo: () => {
    const current = get().elements;

    const previous = useHistoryStore.getState().undo(current);
    const action = useHistoryStore.getState().lastUndoAction;

    if (action && action.length > 0) {
      let updated = current as unknown as import("@shared/oplog").ISharedElement[];
      for (const entry of action) {
        const payload = {
          targetOpId: entry.targetOpId,
          targetOpType: entry.targetOpType,
          tombstoneId: entry.tombstoneId,
          inversePayload: entry.inversePayload as Record<string, unknown>,
        };
        socketService.emitOp("op.undo", payload);
        const undoOp: import("@shared/oplog").IOp = {
          opId: crypto.randomUUID(),
          boardId: get().boardId || "",
          type: "op.undo",
          payload,
          actorId: socketService.getUserId() || "local",
          lamport: 0,
          createdAt: new Date().toISOString(),
        };
        updated = import("@shared/oplog").applyOperation(updated, undoOp);
      }
      set({ elements: updated as unknown as Element[] });
    } else if (previous) {
      set({ elements: previous });
    }
  },

  redo: () => {
    const current = get().elements;

    const next = useHistoryStore.getState().redo(current);
    const action = useHistoryStore.getState().lastRedoAction;

    if (action && action.length > 0) {
      let updated = current as unknown as import("@shared/oplog").ISharedElement[];
      for (const entry of action) {
        const payload = {
          targetOpId: entry.targetOpId,
          targetOpType: entry.targetOpType,
          tombstoneId: entry.tombstoneId,
        };
        socketService.emitOp("op.redo", payload);
        const redoOp: import("@shared/oplog").IOp = {
          opId: crypto.randomUUID(),
          boardId: get().boardId || "",
          type: "op.redo",
          payload,
          actorId: socketService.getUserId() || "local",
          lamport: 0,
          createdAt: new Date().toISOString(),
        };
        updated = import("@shared/oplog").applyOperation(updated, redoOp);
      }
      set({ elements: updated as unknown as Element[] });
    } else if (next) {
      set({ elements: next });
    }
  },
}));
