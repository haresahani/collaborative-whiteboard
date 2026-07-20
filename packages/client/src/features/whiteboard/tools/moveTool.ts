import { snapToGrid } from "../engine/snapping/snapToGrid";
import { translateElements } from "../engine/mutations";
import { hitTestElement } from "../engine/shapes/shapeRegistry";
import type { Element, Point } from "../models/element";
import type { ToolHandler } from "./types";

export interface MoveSession {
  /** Board state before the gesture — becomes the undo snapshot. */
  base: Element[];
  lastPoint: Point;
}

export const moveTool: ToolHandler<MoveSession> = {
  onPointerDown(input, ctx) {
    const hit = [...ctx.elements]
      .reverse()
      .find((el) => hitTestElement(input.world.x, input.world.y, el));

    if (!hit) return { session: null };

    return {
      session: { base: ctx.elements, lastPoint: input.world },
      effects: [
        input.shiftKey
          ? { type: "addToSelection", id: hit.id }
          : { type: "setSelection", ids: [hit.id] },
      ],
    };
  },

  onPointerMove(session, input, ctx) {
    const snapped = input.shiftKey
      ? snapToGrid(input.world.x, input.world.y)
      : input.world;

    const dx = snapped.x - session.lastPoint.x;
    const dy = snapped.y - session.lastPoint.y;

    const next = translateElements(
      ctx.elements,
      ctx.selectedIds,
      dx,
      dy,
      ctx.now(),
    );

    return {
      session: { ...session, lastPoint: input.world },
      effects:
        next === ctx.elements ? [] : [{ type: "setElements", elements: next }],
    };
  },

  onPointerUp(session, _input, ctx) {
    return {
      session: null,
      effects: [{ type: "commit", elements: ctx.elements, base: session.base }],
    };
  },
};
