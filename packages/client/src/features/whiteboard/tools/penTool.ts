import type { StrokeElement } from "../models/element";
import type { ToolHandler } from "./types";
import { samplePoint, simplifyRDP } from "../utils/sampling";

export interface PenSession {
  stroke: StrokeElement;
  rawPoints: { x: number; y: number }[];
}

export const penTool: ToolHandler<PenSession> = {
  onPointerDown(input, ctx) {
    const now = ctx.now();
    const initialPoint = { x: input.world.x, y: input.world.y };

    const stroke: StrokeElement = {
      id: ctx.newId(),
      type: "stroke",
      x: input.world.x,
      y: input.world.y,
      points: [initialPoint],
      style: {
        strokeColor: ctx.style.color,
        strokeWidth: ctx.style.width,
        lineStyle: ctx.style.lineStyle,
      },
      zIndex: 0,
      createdAt: now,
      updatedAt: now,
    };

    return {
      session: { stroke, rawPoints: [initialPoint] },
      preview: stroke,
    };
  },

  onPointerMove(session, input, ctx) {
    if (input.buttons !== 1) {
      return { session, preview: session.stroke };
    }

    const currentPoint = { x: input.world.x, y: input.world.y };
    const sampledPoints = samplePoint(session.rawPoints, currentPoint, 2.5);

    if (sampledPoints.length === session.rawPoints.length) {
      return { session, preview: session.stroke };
    }

    const stroke: StrokeElement = {
      ...session.stroke,
      points: sampledPoints,
      updatedAt: ctx.now(),
    };

    return {
      session: { stroke, rawPoints: sampledPoints },
      preview: stroke,
    };
  },

  onPointerUp(session, _input, ctx) {
    // Perform Ramer-Douglas-Peucker simplification to reduce points before persistence
    const simplifiedPoints = simplifyRDP(session.rawPoints, 1.2);

    const finalizedStroke: StrokeElement = {
      ...session.stroke,
      points: simplifiedPoints,
      updatedAt: ctx.now(),
    };

    return {
      session: null,
      preview: null,
      effects: [
        { type: "commit", elements: [...ctx.elements, finalizedStroke] },
      ],
    };
  },
};
