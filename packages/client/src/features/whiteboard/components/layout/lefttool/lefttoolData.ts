import type { LucideIcon } from "lucide-react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Eraser,
  MousePointer2,
  Pen,
  Square,
  Type,
} from "lucide-react";
import type { LineStyle } from "../../../models/element";
import type { ToolType } from "../../../store/toolStore";

export type ToolPlacement = "persistent" | "one-shot";
export type ToolInspectorKind =
  | "selection"
  | "draw"
  | "shape"
  | "arrow"
  | "text"
  | "eraser";

export interface ToolDefinition {
  tool: ToolType;
  label: string;
  description: string;
  Icon: LucideIcon;
  shortcut: string;
  placement: ToolPlacement;
  inspectorKind: ToolInspectorKind;
  supportsFill?: boolean;
  supportsLineStyle?: boolean;
  supportsTextControls?: boolean;
}

export interface RailSection {
  id: string;
  items: ToolDefinition[];
}

export interface AlignmentAction {
  id: string;
  label: string;
  Icon: LucideIcon;
  mode: "left" | "center" | "right";
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    tool: "select",
    label: "Select",
    description: "Move, resize, and inspect elements.",
    Icon: MousePointer2,
    shortcut: "V",
    placement: "persistent",
    inspectorKind: "selection",
  },
  {
    tool: "pen",
    label: "Pen",
    description: "Draw freeform strokes that stay active while sketching.",
    Icon: Pen,
    shortcut: "P",
    placement: "persistent",
    inspectorKind: "draw",
    supportsLineStyle: true,
  },
  {
    tool: "eraser",
    label: "Eraser",
    description: "Scrub away elements directly on the canvas.",
    Icon: Eraser,
    shortcut: "E",
    placement: "persistent",
    inspectorKind: "eraser",
  },
  {
    tool: "rectangle",
    label: "Shape",
    description: "Place rectangles, then return to selection.",
    Icon: Square,
    shortcut: "R",
    placement: "one-shot",
    inspectorKind: "shape",
    supportsFill: true,
    supportsLineStyle: true,
  },
  {
    tool: "arrow",
    label: "Arrow",
    description: "Connect ideas with a single placement gesture.",
    Icon: ArrowRight,
    shortcut: "A",
    placement: "one-shot",
    inspectorKind: "arrow",
    supportsLineStyle: true,
  },
  {
    tool: "text",
    label: "Text",
    description: "Drop text, edit it inline, then return to selection.",
    Icon: Type,
    shortcut: "T",
    placement: "one-shot",
    inspectorKind: "text",
    supportsTextControls: true,
  },
];

export const TOOL_RAIL_SECTIONS: RailSection[] = [
  {
    id: "core",
    items: [TOOL_DEFINITIONS[0]],
  },
  {
    id: "draw",
    items: [TOOL_DEFINITIONS[1], TOOL_DEFINITIONS[2]],
  },
  {
    id: "create",
    items: [TOOL_DEFINITIONS[3], TOOL_DEFINITIONS[4], TOOL_DEFINITIONS[5]],
  },
];

export const TOOL_RAIL_ITEMS = TOOL_RAIL_SECTIONS.flatMap((section) => section.items);

const TOOL_LOOKUP = Object.fromEntries(
  TOOL_DEFINITIONS.map((definition) => [definition.tool, definition]),
) as Record<ToolType, ToolDefinition>;

export function getToolDefinition(tool: ToolType) {
  return TOOL_LOOKUP[tool];
}

export const ALIGNMENT_ACTIONS: AlignmentAction[] = [
  {
    id: "align-left",
    label: "Align left",
    Icon: AlignLeft,
    mode: "left",
  },
  {
    id: "align-center",
    label: "Align center",
    Icon: AlignCenter,
    mode: "center",
  },
  {
    id: "align-right",
    label: "Align right",
    Icon: AlignRight,
    mode: "right",
  },
];

export const COLOR_SWATCHES = [
  "#232323",
  "#ef5c5c",
  "#f1a439",
  "#87b85c",
  "#2ea780",
  "#2c8fb0",
  "#597ed5",
  "#7c61d4",
];

export const WIDTH_OPTIONS = [1, 2, 4, 6, 8];

export const LINE_STYLE_OPTIONS: Array<{ label: string; value: LineStyle }> = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
  { label: "Dotted", value: "dotted" },
];

export const FONT_FAMILY_OPTIONS = [
  {
    label: "Plus Jakarta Sans",
    value: "\"Plus Jakarta Sans\", sans-serif",
  },
  {
    label: "Georgia",
    value: "Georgia",
  },
  {
    label: "Verdana",
    value: "Verdana",
  },
  {
    label: "Times New Roman",
    value: "\"Times New Roman\"",
  },
  {
    label: "Monospace",
    value: "monospace",
  },
];

export const FONT_SIZE_OPTIONS = [14, 16, 20, 24, 32, 40];

export const FUTURE_TOOL_HINTS = [
  "Sticky notes, uploads, and layers can live in secondary panels once those features ship.",
  "Board actions like clear, undo, and redo should stay outside the drawing inspector.",
];
