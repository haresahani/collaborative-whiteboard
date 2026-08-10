import type { Element, Point } from "../models/element";
import {
  getElementsTouchedByEraser,
  getElementsTouchedByEraserSegment,
} from "./eraser/eraseLogic";
import type { ToolEffect, ToolHandler } from "./types";

export interface EraserSession {
  baseElements: Element[];
  currentElements: Element[];
  lastPoint: Point;
}

export const eraserTool: ToolHandler<EraserSession> = {
  onPointerDown(input, ctx) {
    const touched = getElementsTouchedByEraser(
      ctx.elements,
      input.world,
      ctx.style.eraserSize,
    );
    const touchedIds = new Set(touched.map((el) => el.id));
    const next = ctx.elements.filter((el) => !touchedIds.has(el.id));

    return {
      session: {
        baseElements: ctx.elements,
        currentElements: next,
        lastPoint: input.world,
      },
      effects: [],
    };
  },

  onPointerMove(session, input, ctx) {
    if (input.buttons !== 1) return { session };

    const touched = getElementsTouchedByEraserSegment(
      session.currentElements,
      session.lastPoint,
      input.world,
      ctx.style.eraserSize,
    );

    const nextLastPoint = input.world;

    if (touched.length === 0) {
      return { session: { ...session, lastPoint: nextLastPoint } };
    }

    const touchedIds = new Set(touched.map((el) => el.id));
    const next = session.currentElements.filter((el) => !touchedIds.has(el.id));

    return {
      session: {
        ...session,
        currentElements: next,
        lastPoint: nextLastPoint,
      },
      effects: [],
    };
  },

  onPointerUp(session, _input, ctx) {
    const touchedIds = new Set(
      session.baseElements
        .filter((el) => !session.currentElements.some((c) => c.id === el.id))
        .map((el) => el.id),
    );
    const nextSelection = ctx.selectedIds.filter((id) => !touchedIds.has(id));

    const effects: ToolEffect[] = [
      {
        type: "commit",
        elements: session.currentElements,
        base: session.baseElements,
      },
    ];

    if (nextSelection.length !== ctx.selectedIds.length) {
      effects.push({ type: "setSelection", ids: nextSelection });
    }

    return {
      session: null,
      effects,
    };
  },
};
