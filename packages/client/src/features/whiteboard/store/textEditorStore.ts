import { create } from "zustand";

type TextEditorState = {
  isEditing: boolean;
  elementId: string | null;
  x: number;
  y: number;
  value: string;

  startEditing: (opts: {
    x: number;
    y: number;
    initial?: string;
    elementId?: string | null;
  }) => void;
  stopEditing: () => void;
  setValue: (text: string) => void;
};

export const useTextEditorStore = create<TextEditorState>((set) => ({
  isEditing: false,
  elementId: null,
  x: 0,
  y: 0,
  value: "",

  startEditing: ({ x, y, initial = "", elementId = null }) =>
    set({
      isEditing: true,
      elementId,
      x,
      y,
      value: initial,
    }),

  stopEditing: () =>
    set({
      isEditing: false,
      elementId: null,
      value: "",
    }),
  setValue: (text) => set({ value: text }),
}));
