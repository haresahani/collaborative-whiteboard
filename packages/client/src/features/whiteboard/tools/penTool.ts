import type { StrokeElement } from "../models/element";
import type { ToolHandler } from "./types";

export interface PenSession {
  stroke: StrokeElement;
}

export const penTool: ToolHandler<PenSession> = {
  onPointerDown(input, ctx) {
    const now = ctx.now();

    const stroke: StrokeElement = {
      id: ctx.newId(),
      type: "stroke",
      x: input.world.x,
      y: input.world.y,
      points: [input.world],
      style: {
        strokeColor: ctx.style.color,
        strokeWidth: ctx.style.width,
        lineStyle: ctx.style.lineStyle,
      },
      zIndex: 0,
      createdAt: now,
      updatedAt: now,
    };

    return { session: { stroke }, preview: stroke };
  },

  onPointerMove(session, input, ctx) {
    if (input.buttons !== 1) {
      return { session, preview: session.stroke };
    }

    const stroke: StrokeElement = {
      ...session.stroke,
      points: [...session.stroke.points, input.world],
      updatedAt: ctx.now(),
    };

    return { session: { stroke }, preview: stroke };
  },

  onPointerUp(session, _input, ctx) {
    return {
      session: null,
      preview: null,
      effects: [
        { type: "commit", elements: [...ctx.elements, session.stroke] },
      ],
    };
  },
};
