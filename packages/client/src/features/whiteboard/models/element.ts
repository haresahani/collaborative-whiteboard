import type { ILastUpdateState } from "@shared/utils/lww";

export type ElementType =
  | "stroke"
  | "rectangle"
  | "ellipse"
  | "path"
  | "arrow"
  | "text"
  | "image";

export type LineStyle = "solid" | "dashed" | "dotted";

export interface Point {
  x: number;
  y: number;
}

export interface ElementStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  lineStyle?: LineStyle;
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

  lastUpdate?: ILastUpdateState;
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

export interface EllipseElement extends BaseElement {
  type: "ellipse";

  width: number;
  height: number;

  style: ElementStyle;
}

export interface PathElement extends BaseElement {
  type: "path";

  width: number;
  height: number;
  points: Point[];

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

export interface ImageElement extends BaseElement {
  type: "image";

  src: string;

  width: number;
  height: number;

  opacity?: number;
  flipX?: boolean;
  flipY?: boolean;

  style: ElementStyle;
}

export type Element =
  | StrokeElement
  | RectangleElement
  | EllipseElement
  | PathElement
  | ArrowElement
  | TextElement
  | ImageElement;

