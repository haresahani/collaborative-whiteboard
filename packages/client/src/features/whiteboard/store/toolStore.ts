import { create } from "zustand";
import type { LineStyle } from "../models/element";

export type ToolType =
  | "pen"
  | "eraser"
  | "select"
  | "rectangle"
  | "arrow"
  | "text";

export const ONE_SHOT_TOOLS = ["rectangle", "arrow", "text"] as const;

export function isOneShotTool(tool: ToolType) {
  return (ONE_SHOT_TOOLS as readonly ToolType[]).includes(tool);
}

type ToolState = {
  tool: ToolType;
  color: string;
  fillColor: string;
  width: number;
  lineStyle: LineStyle;
  fontFamily: string;
  fontSize: number;

  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setFillColor: (fillColor: string) => void;
  setWidth: (width: number) => void;
  setLineStyle: (lineStyle: LineStyle) => void;
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: number) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  tool: "pen",
  color: "#ff0000",
  fillColor: "#fff4c2",
  width: 2,
  lineStyle: "solid",
  fontFamily: "\"Plus Jakarta Sans\", sans-serif",
  fontSize: 20,

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setFillColor: (fillColor) => set({ fillColor }),
  setWidth: (width) => set({ width }),
  setLineStyle: (lineStyle) => set({ lineStyle }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontSize: (fontSize) => set({ fontSize }),
}));
