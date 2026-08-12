import { create } from "zustand";
import type { LineStyle } from "../models/element";
import { useCanvasDefaultsStore } from "./useCanvasDefaultsStore";

export type ToolType =
  | "select"
  | "hand"
  | "pen"
  | "eraser"
  | "rectangle"
  | "ellipse"
  | "path"
  | "arrow"
  | "text"
  | "image";

export const ONE_SHOT_TOOLS = [
  "rectangle",
  "ellipse",
  "path",
  "arrow",
  "text",
  "image",
] as const;

export function isOneShotTool(tool: ToolType) {
  return (ONE_SHOT_TOOLS as readonly ToolType[]).includes(tool);
}

type ToolState = {
  tool: ToolType;
  color: string;
  fillColor: string;
  width: number;
  /** Eraser radius in world px — independent from stroke width. */
  eraserSize: number;
  lineStyle: LineStyle;
  fontFamily: string;
  fontSize: number;

  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setFillColor: (fillColor: string) => void;
  setWidth: (width: number) => void;
  setStyle: (style: Partial<{ color: string; fillColor: string; width: number; eraserSize: number; lineStyle: LineStyle; fontFamily: string; fontSize: number }>) => void;
  setEraserSize: (eraserSize: number) => void;
  setLineStyle: (lineStyle: LineStyle) => void;
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: number) => void;
};

const initialDefaults = useCanvasDefaultsStore.getState();

export const useToolStore = create<ToolState>((set) => ({
  tool: "pen",
  color: initialDefaults.defaultStrokeColor || "#6366f1",
  fillColor: "transparent",
  width: initialDefaults.defaultStrokeWidth || 2,
  eraserSize: 16,
  lineStyle: "solid",
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontSize: 20,

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setFillColor: (fillColor) => set({ fillColor }),
  setWidth: (width) => set({ width }),
  setStyle: (style) => set((prev) => ({ ...prev, ...style })),
  setEraserSize: (eraserSize) => set({ eraserSize }),
  setLineStyle: (lineStyle) => set({ lineStyle }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontSize: (fontSize) => set({ fontSize }),
}));
