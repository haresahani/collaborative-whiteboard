// src/store/whiteboardStore.ts
import { create } from "zustand";

/** Types */
export type Board = {
  id: string;
  title?: string;
  subtitle?: string;
  avatarColor?: string;
  pinned?: boolean;
  unread?: number;
  timestamp?: string;
};

export type WhiteboardStoreType = {
  shapes: Board[];
  selectedShapeId: string | null;
  addShape: (s: Partial<Board> & { id?: string }) => void;
  updateShape: (id: string, updates: Partial<Board>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string) => void;
  reorder?: (oldIndex: number, newIndex: number) => void;
};

/** Simple id generator — uses time + random so no external lib required */
function genId(prefix = "b") {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffff).toString(36)}`;
}

/** Minimal store implementation (merge with your own logic as needed) */
export const useWhiteboardStore = create<WhiteboardStoreType>((set, get) => ({
  shapes: [
    // optional initial example
    {
      id: "b-1",
      title: "Welcome board",
      pinned: true,
      timestamp: new Date().toISOString(),
    },
  ],
  selectedShapeId: null,

  addShape: (s) =>
    set((st) => {
      const id = s.id ?? genId();
      const toAdd: Board = {
        id, // set id only once here
        title: s.title ?? "Untitled",
        subtitle: s.subtitle,
        avatarColor: s.avatarColor,
        pinned: s.pinned ?? false,
        unread: s.unread ?? 0,
        timestamp: s.timestamp ?? new Date().toISOString(),
      };
      return { shapes: [...st.shapes, toAdd] };
    }),

  updateShape: (id, updates) =>
    set((st) => ({
      shapes: st.shapes.map((x) => (x.id === id ? { ...x, ...updates } : x)),
    })),

  deleteShape: (id) =>
    set((st) => ({ shapes: st.shapes.filter((x) => x.id !== id) })),

  selectShape: (id) => set(() => ({ selectedShapeId: id })),

  reorder: (oldIndex?: number, newIndex?: number) => {
    // optional reorder implementation — accepts undefined defensively
    if (typeof oldIndex !== "number" || typeof newIndex !== "number") return;
    set((st) => {
      const arr = Array.from(st.shapes);
      const [moved] = arr.splice(oldIndex, 1);
      arr.splice(newIndex, 0, moved);
      return { shapes: arr };
    });
  },
}));

export default useWhiteboardStore;
