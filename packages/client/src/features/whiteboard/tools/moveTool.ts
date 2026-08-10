import { getSelectionBounds } from "../engine/geometry/bounds";
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
    const selectedElements = ctx.elements.filter((el) =>
      ctx.selectedIds.includes(el.id),
    );

    if (selectedElements.length > 0) {
      const bounds = getSelectionBounds(selectedElements);
      const hitPadding = 8;

      if (
        input.world.x >= bounds.minX - hitPadding &&
        input.world.x <= bounds.maxX + hitPadding &&
        input.world.y >= bounds.minY - hitPadding &&
        input.world.y <= bounds.maxY + hitPadding
      ) {
        return {
          session: { base: ctx.elements, lastPoint: input.world },
          effects: [],
        };
      }
    }

    const hit = [...ctx.elements]
      .reverse()
      .find((el) => hitTestElement(input.world.x, input.world.y, el));

    if (!hit) return { session: null };

    const isHitAlreadySelected = ctx.selectedIds.includes(hit.id);

    let nextSelection = ctx.selectedIds;
    if (!isHitAlreadySelected) {
      nextSelection = input.shiftKey
        ? [...new Set([...ctx.selectedIds, hit.id])]
        : [hit.id];
    }

    return {
      session: { base: ctx.elements, lastPoint: input.world },
      effects: [{ type: "setSelection", ids: nextSelection }],
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
