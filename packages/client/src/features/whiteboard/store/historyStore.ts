import { create } from "zustand";
import type { Element } from "../models/element";

export const COALESCE_WINDOW_MS = 1000;

type HistoryState = {
  past: Element[][];
  future: Element[][];

  lastCoalesceKey: string | null;
  lastPushAt: number;

  push: (state: Element[], coalesceKey?: string, now?: number) => void;

  undo: (current: Element[]) => Element[] | null;
  redo: (current: Element[]) => Element[] | null;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  lastCoalesceKey: null,
  lastPushAt: 0,

  push: (state, coalesceKey, now = Date.now()) => {
    const { lastCoalesceKey, lastPushAt } = get();

    const shouldCoalesce =
      coalesceKey !== undefined &&
      coalesceKey === lastCoalesceKey &&
      now - lastPushAt < COALESCE_WINDOW_MS;

    if (shouldCoalesce) {
      // Same gesture continuing (e.g. a color-picker drag): keep the first
      // snapshot, just extend the window and drop any redo branch.
      set({ lastPushAt: now, future: [] });
      return;
    }

    set((s) => ({
      past: [...s.past, state],
      future: [],
      lastCoalesceKey: coalesceKey ?? null,
      lastPushAt: now,
    }));
  },

  undo: (current) => {
    const { past, future } = get();

    if (past.length === 0) return null;

    const previous = past[past.length - 1];

    set({
      past: past.slice(0, past.length - 1),
      future: [current, ...future],
      lastCoalesceKey: null,
      lastPushAt: 0,
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
      lastCoalesceKey: null,
      lastPushAt: 0,
    });

    return next;
  },
}));
