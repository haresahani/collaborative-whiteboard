import { create } from "zustand";
import type { DrawingElement, Point } from "@/types/whiteboard";

const genId = (prefix = "el") =>
  `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffff).toString(36)}`;

type WhiteboardElementsState = {
  elements: DrawingElement[];
  selectedElements: string[]; // multi-select
  currentUser?: { id: string; name?: string };

  // CRUD
  addElement: (el: DrawingElement) => void;
  updateElement: (id: string, updates: Partial<DrawingElement>) => void;
  patchElementData: (
    id: string,
    dataPatch: Partial<DrawingElement["data"]>,
  ) => void;
  deleteElement: (id: string) => void;

  // selection
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;

  // reorder / move
  reorderElements: (oldIndex: number, newIndex: number) => void;
};

export const useWhiteboardElementsStore = create<WhiteboardElementsState>(
  (set, get) => ({
    elements: [],
    selectedElements: [],
    currentUser: undefined,

    addElement: (el) =>
      set((s) => ({
        elements: [
          ...s.elements,
          {
            ...el,
            id: el.id ?? genId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      })),

    updateElement: (id, updates) =>
      set((s) => {
        const elements = s.elements.map((e) => {
          if (e.id !== id) return e;
          return { ...e, ...updates, updatedAt: Date.now() };
        });
        return { elements };
      }),

    patchElementData: (id, dataPatch) =>
      set((s) => {
        const elements = s.elements.map((e) => {
          if (e.id !== id) return e;
          return {
            ...e,
            data: { ...e.data, ...dataPatch },
            updatedAt: Date.now(),
          } as DrawingElement; // safe because we're only adding/override properties
        });
        return { elements };
      }),

    deleteElement: (id) =>
      set((s) => ({ elements: s.elements.filter((e) => e.id !== id) })),

    selectElements: (ids) => set(() => ({ selectedElements: ids })),

    clearSelection: () => set(() => ({ selectedElements: [] })),

    reorderElements: (oldIndex, newIndex) =>
      set((s) => {
        const arr = Array.from(s.elements);
        const [moved] = arr.splice(oldIndex, 1);
        if (!moved) return s;
        arr.splice(newIndex, 0, moved);
        return { elements: arr };
      }),
  }),
);

export default useWhiteboardElementsStore;
