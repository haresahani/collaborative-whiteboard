import { getSelectionBounds } from "../engine/geometry/bounds";
import {
  getHandleUnderPoint,
  type Handle,
} from "../engine/geometry/resizeHandles";
import { resizeElements } from "../engine/mutations";
import type { Element, Point } from "../models/element";
import type { ToolHandler } from "./types";

export interface ResizeSession {
  handle: Handle;
  /** Board state before the gesture — becomes the undo snapshot. */
  base: Element[];
  lastPoint: Point;
}

export const resizeTool: ToolHandler<ResizeSession> = {
  onPointerDown(input, ctx) {
    if (ctx.selectedIds.length === 0) return { session: null };

    const selected = ctx.elements.filter((el) =>
      ctx.selectedIds.includes(el.id),
    );

    if (selected.length === 0) return { session: null };

    const bounds = getSelectionBounds(selected);
    const handle = getHandleUnderPoint(input.world.x, input.world.y, bounds);

    if (!handle) return { session: null };

    return {
      session: { handle, base: ctx.elements, lastPoint: input.world },
    };
  },

  onPointerMove(session, input, ctx) {
    const dx = input.world.x - session.lastPoint.x;
    const dy = input.world.y - session.lastPoint.y;

    const next = resizeElements(
      ctx.elements,
      ctx.selectedIds,
      session.handle,
      dx,
      dy,
      ctx.now(),
    );

    return {
      session: { ...session, lastPoint: input.world },
      effects: next === ctx.elements ? [] : [{ type: "setElements", elements: next }],
    };
  },

  onPointerUp(session, _input, ctx) {
    return {
      session: null,
      effects: [
        { type: "commit", elements: ctx.elements, base: session.base },
      ],
    };
  },
};
