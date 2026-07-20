import type { Point } from "../models/element";
import { getElementsTouchedByEraser } from "./eraser/eraseLogic";
import type { ToolContext, ToolEffect, ToolHandler, ToolResult } from "./types";

export interface EraserSession {
  /** True once this gesture has recorded its single history entry. */
  committed: boolean;
}

function eraseAt(
  session: EraserSession,
  world: Point,
  ctx: ToolContext,
): ToolResult<EraserSession> {
  const touched = getElementsTouchedByEraser(
    ctx.elements,
    world,
    ctx.style.eraserSize,
  );

  if (touched.length === 0) return { session };

  const touchedIds = new Set(touched.map((el) => el.id));
  const next = ctx.elements.filter((el) => !touchedIds.has(el.id));

  const effects: ToolEffect[] = [
    // The first hit of a gesture records history; later hits are live
    // frames, so one eraser sweep is one undo step.
    session.committed
      ? { type: "setElements", elements: next }
      : { type: "commit", elements: next },
  ];

  const remaining = ctx.selectedIds.filter((id) => !touchedIds.has(id));

  if (remaining.length !== ctx.selectedIds.length) {
    effects.push({ type: "setSelection", ids: remaining });
  }

  return { session: { committed: true }, effects };
}

export const eraserTool: ToolHandler<EraserSession> = {
  onPointerDown(input, ctx) {
    return eraseAt({ committed: false }, input.world, ctx);
  },

  onPointerMove(session, input, ctx) {
    if (input.buttons !== 1) return { session };

    return eraseAt(session, input.world, ctx);
  },

  onPointerUp() {
    return { session: null };
  },
};
