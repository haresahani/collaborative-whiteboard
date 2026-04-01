import { create } from "zustand";
import type { Element } from "../models/element";
import { useHistoryStore } from "./historyStore";

type BoardState = {
  elements: Element[];

  addElement: (element: Element) => void;
  setElements: (elements: Element[]) => void;
  updateElement: (id: string, updater: (el: Element) => Element) => void;

  undo: () => void;
  redo: () => void;
};

export const useBoardStore = create<BoardState>((set, get) => ({
  elements: [],

  addElement: (element) => {
    const elements = [...get().elements, element];

    useHistoryStore.getState().push(get().elements);

    set({ elements });
  },

  setElements: (elements) => set({ elements }),

  updateElement: (id, updater) => {
    const prev = get().elements;
    const next = prev.map((el) => (el.id === id ? updater(el) : el));

    if (next === prev) return;
    useHistoryStore.getState().push(prev);
    set({ elements: next });
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
