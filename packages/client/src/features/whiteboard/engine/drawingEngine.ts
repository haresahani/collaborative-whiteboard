import type {
  StrokeElement,
  RectangleElement,
  ArrowElement,
  TextElement,
  Point,
} from "../models/element";
import { generateUUID } from "../../../lib/utils";

export class DrawingEngine {
  private currentStroke: StrokeElement | null = null;
  private currentRectangle: RectangleElement | null = null;
  private currentArrow: ArrowElement | null = null;
  private currentText: TextElement | null = null;

  /*
  ----------------------------------------
  Start Stroke
  ----------------------------------------
  */

  startStroke(point: Point, color: string, width: number) {
    this.currentStroke = {
      id: generateUUID(),

      type: "stroke",

      x: point.x,
      y: point.y,

      points: [point],

      style: {
        strokeColor: color,
        strokeWidth: width,
      },

      zIndex: 0,

      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /*
  ----------------------------------------
  Add Point While Drawing Stroke
  ----------------------------------------
  */

  addPoint(point: Point) {
    if (!this.currentStroke) return;

    this.currentStroke.points.push(point);
    this.currentStroke.updatedAt = Date.now();
  }

  endStroke(): StrokeElement | null {
    const finished = this.currentStroke;
    this.currentStroke = null;
    return finished;
  }

  getCurrentStroke() {
    return this.currentStroke;
  }
  /*
  ----------------------------------------
  Start Rectangle
  ----------------------------------------
  */

  startRectangle(point: Point, color: string, width: number) {
    this.currentRectangle = {
      id: generateUUID(),
      type: "rectangle",
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      style: {
        strokeColor: color,
        strokeWidth: width,
      },
      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  updateRectangle(point: Point) {
    if (!this.currentRectangle) return;

    this.currentRectangle.width = point.x - this.currentRectangle.x;
    this.currentRectangle.height = point.y - this.currentRectangle.y;
    this.currentRectangle.updatedAt = Date.now();
  }

  endRectangle(): RectangleElement | null {
    const rect = this.currentRectangle;
    this.currentRectangle = null;
    return rect;
  }

  getCurrentRectangle() {
    return this.currentRectangle;
  }

  // Start Arrow
  startArrow(point: Point, color: string, width: number) {
    this.currentArrow = {
      id: generateUUID(),
      type: "arrow",
      x: point.x,
      y: point.y,
      x1: point.x,
      y1: point.y,
      x2: point.x,
      y2: point.y,
      rotation: 0,
      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      style: {
        strokeColor: color,
        strokeWidth: width,
      },
    };
  }

  //Update Arrow
  updateArrow(point: Point) {
    if (!this.currentArrow) return;

    this.currentArrow.x2 = point.x;
    this.currentArrow.y2 = point.y;
    this.currentArrow.updatedAt = Date.now();
  }

  //End Arrow
  endArrow() {
    const arrow = this.currentArrow;
    this.currentArrow = null;
    return arrow;
  }

  //Getter
  getCurrentArrow() {
    return this.currentArrow;
  }

  //Start Text
  startText(point: Point, color: string) {
    const defaultText = "Text";
    const fontSize = 20;

    this.currentText = {
      id: generateUUID(),
      type: "text",

      x: point.x,
      y: point.y,

      text: defaultText,

      width: defaultText.length * (fontSize * 0.6),
      height: fontSize,

      fontSize,

      style: {
        strokeColor: color,
        strokeWidth: 1,
      },

      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  //Update text
  updateText(text: string) {
    if (!this.currentText) return;

    this.currentText.text = text;
    this.currentText.updatedAt = Date.now();
  }

  //End Text
  endText() {
    const text = this.currentText;
    this.currentText = null;
    return text;
  }

  //Getter
  getCurrentText() {
    return this.currentText;
  }
}
