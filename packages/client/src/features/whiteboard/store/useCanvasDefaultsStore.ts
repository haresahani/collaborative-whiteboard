import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GridStyle } from "../engine/grid";

interface CanvasDefaultsState {
  gridStyle: GridStyle;
  snapToGrid: boolean;
  defaultStrokeColor: string;
  defaultStrokeWidth: number;
  exportScale: number;

  setGridStyle: (style: GridStyle) => void;
  setSnapToGrid: (snap: boolean) => void;
  setDefaultStrokeColor: (color: string) => void;
  setDefaultStrokeWidth: (width: number) => void;
  setExportScale: (scale: number) => void;
}

export const useCanvasDefaultsStore = create<CanvasDefaultsState>()(
  persist(
    (set) => ({
      gridStyle: "dots",
      snapToGrid: false,
      defaultStrokeColor: "#6366f1",
      defaultStrokeWidth: 2,
      exportScale: 2,

      setGridStyle: (gridStyle) => set({ gridStyle }),
      setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
      setDefaultStrokeColor: (defaultStrokeColor) => set({ defaultStrokeColor }),
      setDefaultStrokeWidth: (defaultStrokeWidth) => set({ defaultStrokeWidth }),
      setExportScale: (exportScale) => set({ exportScale }),
    }),
    {
      name: "collab_whiteboard_canvas_defaults",
    },
  ),
);
