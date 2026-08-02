import { create } from "zustand";
import type { Element } from "../models/element";

export const COALESCE_WINDOW_MS = 1000;

export interface HistoryOpEntry {
  targetOpId: string;
  targetOpType: string;
  tombstoneId?: string;
  inversePayload?: {
    restoredElement?: Element;
    inverseUpdates?: Record<string, unknown>;
  };
}

export type HistoryAction = HistoryOpEntry[];

type HistoryState = {
  past: Element[][];
  future: Element[][];

  undoStack: HistoryAction[];
  redoStack: HistoryAction[];

  lastUndoAction: HistoryAction | null;
  lastRedoAction: HistoryAction | null;

  lastCoalesceKey: string | null;
  lastPushAt: number;

  push: (state: Element[], coalesceKey?: string, now?: number, ops?: HistoryAction) => void;

  undo: (current: Element[]) => Element[] | null;
  redo: (current: Element[]) => Element[] | null;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  undoStack: [],
  redoStack: [],

  lastUndoAction: null,
  lastRedoAction: null,

  lastCoalesceKey: null,
  lastPushAt: 0,

  push: (state, coalesceKey, now = Date.now(), ops) => {
    const { lastCoalesceKey, lastPushAt, undoStack } = get();

    const shouldCoalesce =
      coalesceKey !== undefined &&
      coalesceKey === lastCoalesceKey &&
      now - lastPushAt < COALESCE_WINDOW_MS;

    if (shouldCoalesce) {
      // Same gesture continuing: extend window and invalidate redo stack [FIX 6]
      set({ lastPushAt: now, future: [], redoStack: [], lastRedoAction: null });
      return;
    }

    const newUndoStack = ops && ops.length > 0 ? [...undoStack, ops] : undoStack;

    set((s) => ({
      past: [...s.past, state],
      future: [], // [FIX 6] Invalidate redo snapshot stack
      undoStack: newUndoStack,
      redoStack: [], // [FIX 6] Invalidate redo operation stack
      lastUndoAction: null,
      lastRedoAction: null,
      lastCoalesceKey: coalesceKey ?? null,
      lastPushAt: now,
    }));
  },

  undo: (current) => {
    const { past, future, undoStack, redoStack } = get();

    if (past.length === 0 && undoStack.length === 0) {
      set({ lastUndoAction: null });
      return null;
    }

    const previous = past.length > 0 ? past[past.length - 1] : null;
    const action = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;

    set({
      past: past.length > 0 ? past.slice(0, past.length - 1) : [],
      future: [current, ...future],
      undoStack: undoStack.length > 0 ? undoStack.slice(0, undoStack.length - 1) : [],
      redoStack: action ? [...redoStack, action] : redoStack,
      lastUndoAction: action,
      lastCoalesceKey: null,
      lastPushAt: 0,
    });

    return previous;
  },

  redo: (current) => {
    const { past, future, undoStack, redoStack } = get();

    if (future.length === 0 && redoStack.length === 0) {
      set({ lastRedoAction: null });
      return null;
    }

    const next = future.length > 0 ? future[0] : null;
    const action = redoStack.length > 0 ? redoStack[redoStack.length - 1] : null;

    set({
      past: [...past, current],
      future: future.length > 0 ? future.slice(1) : [],
      undoStack: action ? [...undoStack, action] : undoStack,
      redoStack: redoStack.length > 0 ? redoStack.slice(0, redoStack.length - 1) : [],
      lastRedoAction: action,
      lastCoalesceKey: null,
      lastPushAt: 0,
    });

    return next;
  },
}));
