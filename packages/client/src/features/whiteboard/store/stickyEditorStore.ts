import { create } from "zustand";
import type { StickyElement } from "../models/element";

type StickyEditorState = {
  activeSticky: StickyElement | null;
  startEditing: (sticky: StickyElement) => void;
  stopEditing: () => void;
};

export const useStickyEditorStore = create<StickyEditorState>((set) => ({
  activeSticky: null,
  startEditing: (sticky) => set({ activeSticky: sticky }),
  stopEditing: () => set({ activeSticky: null }),
}));
