import { create } from "zustand";
import type { Element } from "../models/element";

type HistoryState = {
  past: Element[][];
  future: Element[][];

  push: (state: Element[]) => void;

  undo: (current: Element[]) => Element[] | null;
  redo: (current: Element[]) => Element[] | null;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  push: (state) =>
    set((s) => ({
      past: [...s.past, state],
      future: [],
    })),

  undo: (current) => {
    const { past, future } = get();

    if (past.length === 0) return null;

    const previous = past[past.length - 1];

    set({
      past: past.slice(0, past.length - 1),
      future: [current, ...future],
    });

    return previous;
  },

  redo: (current) => {
    const { past, future } = get();

    if (future.length === 0) return null;

    const next = future[0];

    set({
      past: [...past, current],
      future: future.slice(1),
    });

    return next;
  },
}));
