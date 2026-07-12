import { computeBindingAnchor } from "../engine/bindings/arrowBinding";
import { findBindableElement } from "../engine/bindings/findBindableElement";
import type {
  ArrowElement,
  Point,
  RectangleElement,
} from "../models/element";
import type { ToolHandler } from "./types";

export interface RectangleSession {
  rectangle: RectangleElement;
}

export const rectangleTool: ToolHandler<RectangleSession> = {
  onPointerDown(input, ctx) {
    const now = ctx.now();

    const rectangle: RectangleElement = {
      id: ctx.newId(),
      type: "rectangle",
      x: input.world.x,
      y: input.world.y,
      width: 0,
      height: 0,
      style: {
        strokeColor: ctx.style.color,
        strokeWidth: ctx.style.width,
        fillColor: ctx.style.fillColor,
        lineStyle: ctx.style.lineStyle,
      },
      zIndex: 0,
      createdAt: now,
      updatedAt: now,
    };

    return { session: { rectangle }, preview: rectangle };
  },

  onPointerMove(session, input, ctx) {
    const rectangle: RectangleElement = {
      ...session.rectangle,
      width: input.world.x - session.rectangle.x,
      height: input.world.y - session.rectangle.y,
      updatedAt: ctx.now(),
    };

    return { session: { rectangle }, preview: rectangle };
  },

  onPointerUp(session, _input, ctx) {
    return {
      session: null,
      preview: null,
      effects: [
        { type: "commit", elements: [...ctx.elements, session.rectangle] },
        { type: "setSelection", ids: [session.rectangle.id] },
        { type: "switchTool", tool: "select" },
      ],
    };
  },
};

export interface ArrowSession {
  arrow: ArrowElement;
}

export const arrowTool: ToolHandler<ArrowSession> = {
  onPointerDown(input, ctx) {
    const now = ctx.now();

    const arrow: ArrowElement = {
      id: ctx.newId(),
      type: "arrow",
      x: input.world.x,
      y: input.world.y,
      x1: input.world.x,
      y1: input.world.y,
      x2: input.world.x,
      y2: input.world.y,
      rotation: 0,
      zIndex: 0,
      createdAt: now,
      updatedAt: now,
      style: {
        strokeColor: ctx.style.color,
        strokeWidth: ctx.style.width,
        lineStyle: ctx.style.lineStyle,
      },
    };

    return { session: { arrow }, preview: arrow };
  },

  onPointerMove(session, input, ctx) {
    if (input.buttons !== 1) {
      return { session, preview: session.arrow };
    }

    const arrow: ArrowElement = {
      ...session.arrow,
      x2: input.world.x,
      y2: input.world.y,
      updatedAt: ctx.now(),
    };

    return { session: { arrow }, preview: arrow };
  },

  onPointerUp(session, _input, ctx) {
    let arrow = session.arrow;

    const startTarget = findBindableElement(arrow.x1, arrow.y1, ctx.elements);
    if (startTarget) {
      arrow = {
        ...arrow,
        startBinding: {
          elementId: startTarget.id,
          anchor: computeBindingAnchor(startTarget, arrow.x1, arrow.y1),
        },
      };
    }

    const endTarget = findBindableElement(arrow.x2, arrow.y2, ctx.elements);
    if (endTarget) {
      arrow = {
        ...arrow,
        endBinding: {
          elementId: endTarget.id,
          anchor: computeBindingAnchor(endTarget, arrow.x2, arrow.y2),
        },
      };
    }

    return {
      session: null,
      preview: null,
      effects: [
        { type: "commit", elements: [...ctx.elements, arrow] },
        { type: "setSelection", ids: [arrow.id] },
        { type: "switchTool", tool: "select" },
      ],
    };
  },
};

export interface TextSession {
  point: Point;
}

/**
 * Text is placed on pointer UP (not down) so opening the DOM editor does not
 * immediately lose focus to the same pointer gesture.
 */
export const textTool: ToolHandler<TextSession> = {
  onPointerDown(input) {
    return { session: { point: input.world } };
  },

  onPointerMove(session) {
    return { session };
  },

  onPointerUp(session) {
    return {
      session: null,
      effects: [
        { type: "openTextEditor", x: session.point.x, y: session.point.y },
        { type: "switchTool", tool: "select" },
      ],
    };
  },
};
