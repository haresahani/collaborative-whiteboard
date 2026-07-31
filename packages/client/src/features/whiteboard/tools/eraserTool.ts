import type { Element } from "../models/element";
import { getElementsTouchedByEraser } from "./eraser/eraseLogic";
import type { ToolEffect, ToolHandler } from "./types";

export interface EraserSession {
  baseElements: Element[];
  currentElements: Element[];
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

    const effects: ToolEffect[] = [];
    if (next.length !== ctx.elements.length) {
      effects.push({ type: "setElements", elements: next });
      const remaining = ctx.selectedIds.filter((id) => !touchedIds.has(id));
      if (remaining.length !== ctx.selectedIds.length) {
        effects.push({ type: "setSelection", ids: remaining });
      }
    }

    return {
      session: { baseElements: ctx.elements, currentElements: next },
      effects,
    };
  },

  onPointerMove(session, input, ctx) {
    if (input.buttons !== 1) return { session };

    const touched = getElementsTouchedByEraser(
      session.currentElements,
      input.world,
      ctx.style.eraserSize,
    );

    if (touched.length === 0) return { session };

    const touchedIds = new Set(touched.map((el) => el.id));
    const next = session.currentElements.filter((el) => !touchedIds.has(el.id));

    const effects: ToolEffect[] = [{ type: "setElements", elements: next }];
    const remaining = ctx.selectedIds.filter((id) => !touchedIds.has(id));
    if (remaining.length !== ctx.selectedIds.length) {
      effects.push({ type: "setSelection", ids: remaining });
    }

    return {
      session: { ...session, currentElements: next },
      effects,
    };
  },

  onPointerUp(session) {
    return {
      session: null,
      effects: [
        {
          type: "commit",
          elements: session.currentElements,
          base: session.baseElements,
        },
      ],
    };
  },
};
