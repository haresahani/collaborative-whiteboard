import { create } from "zustand";
import type { Element } from "../models/element";
import { useHistoryStore } from "./historyStore";

type BoardState = {
  elements: Element[];

  /**
   * Replace the board with `elements`, recording the previous state in
   * history. Pass a `coalesceKey` when rapid successive commits belong to a
   * single gesture (e.g. dragging inside a color picker) so undo treats them
   * as one step. Pass `base` when the store already holds live (uncommitted)
   * frames of a gesture — e.g. a drag rendered via setElements — so the
   * history snapshot is the pre-gesture state instead of the last frame.
   */
  commit: (
    elements: Element[],
    coalesceKey?: string,
    base?: Element[],
  ) => void;

  addElement: (element: Element) => void;
  /** Replace the board WITHOUT recording history (live drag frames). */
  setElements: (elements: Element[]) => void;
  updateElement: (id: string, updater: (el: Element) => Element) => void;

  undo: () => void;
  redo: () => void;
};

export const useBoardStore = create<BoardState>((set, get) => ({
  elements: [],

  commit: (elements, coalesceKey, base) => {
    const current = get().elements;
    const snapshot = base ?? current;

    // Mutations return the same array reference when nothing changed;
    // skip those so no-ops never pollute the undo history.
    if (elements === snapshot) return;

    useHistoryStore.getState().push(snapshot, coalesceKey);

    if (elements !== current) {
      set({ elements });
    }
  },

  addElement: (element) => {
    get().commit([...get().elements, element]);
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

    if (previous) {
      set({ elements: previous });
    }
  },

  redo: () => {
    const current = get().elements;

    const next = useHistoryStore.getState().redo(current);

    if (next) {
      set({ elements: next });
    }
  },
}));
