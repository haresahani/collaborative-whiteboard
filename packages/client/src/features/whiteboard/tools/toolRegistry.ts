import { hitTestElement } from "../engine/shapes/shapeRegistry";
import type { ToolType } from "../store/toolStore";
import { eraserTool } from "./eraserTool";
import { marqueeTool } from "./marqueeTool";
import { moveTool } from "./moveTool";
import { penTool } from "./penTool";
import { resizeTool } from "./resizeTool";
import { arrowTool, rectangleTool, textTool } from "./shapeTool";
import type {
  PointerInput,
  ToolContext,
  ToolHandler,
  ToolResult,
} from "./types";

/**
 * Pointer-down candidates per tool, tried in order. A handler that returns a
 * null session declines the gesture and the next candidate is asked — for
 * the select tool that resolves resize handles before element drags before
 * marquee selection.
 */
const POINTER_DOWN_CANDIDATES: Record<ToolType, ToolHandler<never>[]> = {
  select: [resizeTool, moveTool, marqueeTool] as ToolHandler<never>[],
  pen: [penTool] as ToolHandler<never>[],
  eraser: [eraserTool] as ToolHandler<never>[],
  rectangle: [rectangleTool] as ToolHandler<never>[],
  arrow: [arrowTool] as ToolHandler<never>[],
  text: [textTool] as ToolHandler<never>[],
};

export interface ResolvedPointerDown {
  handler: ToolHandler<unknown>;
  result: ToolResult<unknown>;
}

export function resolvePointerDown(
  tool: ToolType,
  input: PointerInput,
  ctx: ToolContext,
): ResolvedPointerDown | null {
  for (const handler of POINTER_DOWN_CANDIDATES[tool]) {
    const result = (handler as ToolHandler<unknown>).onPointerDown(input, ctx);

    if (result.session !== null || (result.effects?.length ?? 0) > 0) {
      return { handler: handler as ToolHandler<unknown>, result };
    }
  }

  return null;
}

/**
 * Double-click with the select tool starts inline editing of a text element.
 * Pure: returns effects for the host to dispatch, or null when nothing was
 * hit.
 */
export function resolveDoubleClick(
  tool: ToolType,
  input: PointerInput,
  ctx: ToolContext,
): ToolResult<never> | null {
  if (tool !== "select") return null;

  const hit = [...ctx.elements]
    .reverse()
    .find((el) => hitTestElement(input.world.x, input.world.y, el));

  if (hit?.type !== "text") return null;

  return {
    session: null,
    effects: [
      { type: "setSelection", ids: [hit.id] },
      {
        type: "openTextEditor",
        elementId: hit.id,
        x: hit.x,
        y: hit.y,
        initial: hit.text,
      },
    ],
  };
}
