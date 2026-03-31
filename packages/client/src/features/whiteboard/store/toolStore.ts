import { create } from "zustand";

export type ToolType =
  | "pen"
  | "eraser"
  | "select"
  | "rectangle"
  | "arrow"
  | "text";

type ToolState = {
  tool: ToolType;
  color: string;
  width: number;

  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  tool: "pen",
  color: "#ff0000",
  width: 2,

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setWidth: (width) => set({ width }),
}));
