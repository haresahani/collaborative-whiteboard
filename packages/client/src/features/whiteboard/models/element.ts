export type ElementType = "stroke" | "rectangle" | "arrow" | "text";

export interface Point {
  x: number;
  y: number;
}

export interface ElementStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
}

export interface BaseElement {
  id: string;
  type: ElementType;

  x: number;
  y: number;

  rotation?: number;
  zIndex: number;

  createdAt: number;
  updatedAt: number;

  deleted?: boolean;
}

export interface StrokeElement extends BaseElement {
  type: "stroke";

  points: Point[];

  style: ElementStyle;
}

export interface RectangleElement extends BaseElement {
  type: "rectangle";

  width: number;
  height: number;

  style: ElementStyle;
}

export interface ArrowBinding {
  elementId: string;
  anchor: {
    x: number;
    y: number;
  };
}

export interface ArrowElement extends BaseElement {
  type: "arrow";

  x1: number;
  y1: number;
  x2: number;
  y2: number;

  style: ElementStyle;

  startBinding?: ArrowBinding;
  endBinding?: ArrowBinding;
}

export interface TextElement extends BaseElement {
  type: "text";

  text: string;

  width: number;
  height: number;

  fontSize: number;
  fontFamily?: string;

  style: ElementStyle;
}

export type Element =
  | StrokeElement
  | RectangleElement
  | ArrowElement
  | TextElement;
