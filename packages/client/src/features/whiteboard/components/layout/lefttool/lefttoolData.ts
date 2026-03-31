import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Circle,
  Diamond,
  Eraser,
  Hand,
  Hexagon,
  Highlighter,
  ImagePlus,
  Layers3,
  MousePointer2,
  Octagon,
  Paperclip,
  Pen,
  Redo2,
  Star,
  Square,
  SquarePen,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import type { ToolType } from "../../../store/toolStore";

export type LeftToolTile = {
  id: string;
  label: string;
  caption?: string;
  Icon: LucideIcon;
  tool?: ToolType;
  matches?: ToolType[];
  shortcut?: string;
  disabled?: boolean;
};

export type ShapeMenuItem = {
  id: string;
  label: string;
  Icon: LucideIcon;
  tool?: ToolType;
  disabled?: boolean;
};

export const RAIL_TOOLS: LeftToolTile[] = [
  {
    id: "select",
    label: "Select",
    caption: "Move and resize",
    Icon: MousePointer2,
    tool: "select",
    shortcut: "V",
  },
  {
    id: "pen",
    label: "Pen",
    caption: "Sketch freely",
    Icon: Pen,
    tool: "pen",
    shortcut: "P",
  },
  {
    id: "rectangle",
    label: "Rectangle",
    caption: "Draw boxes",
    Icon: Square,
    tool: "rectangle",
    shortcut: "R",
  },
  {
    id: "arrow",
    label: "Arrow",
    caption: "Connect ideas",
    Icon: ArrowRight,
    tool: "arrow",
    shortcut: "A",
  },
  {
    id: "text",
    label: "Text",
    caption: "Add labels",
    Icon: Type,
    tool: "text",
    shortcut: "T",
  },
  {
    id: "eraser",
    label: "Eraser",
    caption: "Remove touched items",
    Icon: Eraser,
    tool: "eraser",
    shortcut: "E",
  },
];

export const CORE_SECTION_ITEMS: LeftToolTile[] = [
  RAIL_TOOLS[0],
  {
    id: "hand-pan",
    label: "Hand Pan",
    caption: "Coming soon",
    Icon: Hand,
    disabled: true,
  },
  RAIL_TOOLS[1],
  {
    id: "highlighter",
    label: "Highlighter",
    caption: "Coming soon",
    Icon: Highlighter,
    disabled: true,
  },
  RAIL_TOOLS[5],
  {
    id: "shapes",
    label: "Shapes",
    caption: "Rectangle / Arrow",
    Icon: Square,
    tool: "rectangle",
    matches: ["rectangle", "arrow"],
  },
];

export const TEXT_ASSET_ITEMS: LeftToolTile[] = [
  RAIL_TOOLS[4],
  {
    id: "notes",
    label: "Notes / Comments",
    caption: "Coming soon",
    Icon: SquarePen,
    disabled: true,
  },
  {
    id: "images",
    label: "Images / Uploads",
    caption: "Coming soon",
    Icon: ImagePlus,
    disabled: true,
  },
  {
    id: "attachments",
    label: "Attachments",
    caption: "Coming soon",
    Icon: Paperclip,
    disabled: true,
  },
];

export const BOARD_ACTION_ITEMS: LeftToolTile[] = [
  {
    id: "undo",
    label: "Undo",
    caption: "Last action",
    Icon: Undo2,
  },
  {
    id: "redo",
    label: "Redo",
    caption: "Next action",
    Icon: Redo2,
  },
  {
    id: "layers",
    label: "Layers",
    caption: "Coming soon",
    Icon: Layers3,
    disabled: true,
  },
  {
    id: "clear",
    label: "Clear",
    caption: "Wipe canvas",
    Icon: Trash2,
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
  "#c35ca7",
];

export const WIDTH_OPTIONS = [1, 2, 4, 6];
export const LINE_STYLE_OPTIONS = ["Solid", "Dashed", "Dotted"];
export const FONT_FAMILY_OPTIONS = [
  "Lato",
  "Open Sans",
  "Times New Roman",
  "Georgia",
  "Verdana",
];
export const FONT_SIZE_OPTIONS = ["14px", "16px", "20px", "24px", "32px"];

export const SHAPE_MENU_ITEMS: ShapeMenuItem[] = [
  {
    id: "shape-rectangle",
    label: "Rectangle",
    Icon: Square,
    tool: "rectangle",
  },
  {
    id: "shape-circle",
    label: "Ellipse",
    Icon: Circle,
    disabled: true,
  },
  {
    id: "shape-diamond",
    label: "Diamond",
    Icon: Diamond,
    disabled: true,
  },
  {
    id: "shape-hexagon",
    label: "Hexagon",
    Icon: Hexagon,
    disabled: true,
  },
  {
    id: "shape-star",
    label: "Star",
    Icon: Star,
    disabled: true,
  },
  {
    id: "shape-octagon",
    label: "Octagon",
    Icon: Octagon,
    disabled: true,
  },
];
