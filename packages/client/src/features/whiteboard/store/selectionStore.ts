import { create } from "zustand";

export interface MarqueeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type SelectionState = {
  selectedIds: string[];
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  clearSelection: () => void;

  marquee: MarqueeBox | null;
  setMarquee: (box: MarqueeBox | null) => void;
};

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],
  marquee: null,

  setSelection: (ids) => set({ selectedIds: ids }),

  addToSelection: (id) =>
    set((state) => ({
      selectedIds: [...state.selectedIds, id],
    })),

  clearSelection: () => set({ selectedIds: [] }),

  setMarquee: (box) => set({ marquee: box }),
}));
