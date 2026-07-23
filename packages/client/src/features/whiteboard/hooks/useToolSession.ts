import { useCallback, useRef } from "react";
import { generateUUID } from "../../../lib/utils";
import { screenToWorld } from "../engine/viewport";
import type { Element } from "../models/element";
import { useBoardStore } from "../store/boardStore";
import { useSelectionStore } from "../store/selectionStore";
import { useTextEditorStore } from "../store/textEditorStore";
import { useToolStore } from "../store/toolStore";
import { useViewportStore } from "../store/viewportStore";
import { resolveDoubleClick, resolvePointerDown } from "../tools/toolRegistry";
import type {
  PointerInput,
  ToolContext,
  ToolEffect,
  ToolHandler,
  ToolResult,
} from "../tools/types";

interface ActiveGesture {
  handler: ToolHandler<unknown>;
  session: unknown;
}

function buildContext(): ToolContext {
  const { color, fillColor, width, eraserSize, lineStyle } =
    useToolStore.getState();

  return {
    elements: useBoardStore.getState().elements,
    selectedIds: useSelectionStore.getState().selectedIds,
    style: { color, fillColor, width, eraserSize, lineStyle },
    newId: generateUUID,
    now: Date.now,
  };
}

function buildInput(
  e:
    | React.PointerEvent<HTMLCanvasElement>
    | React.MouseEvent<HTMLCanvasElement>,
): PointerInput {
  return {
    world: screenToWorld(
      { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
      useViewportStore.getState(),
    ),
    shiftKey: e.shiftKey,
    buttons: e.buttons,
  };
}

function runEffects(effects: ToolEffect[]) {
  for (const effect of effects) {
    switch (effect.type) {
      case "setSelection":
        useSelectionStore.getState().setSelection(effect.ids);
        break;
      case "addToSelection":
        useSelectionStore.getState().addToSelection(effect.id);
        break;
      case "setElements":
        useBoardStore.getState().setElements(effect.elements);
        break;
      case "commit":
        useBoardStore
          .getState()
          .commit(effect.elements, effect.coalesceKey, effect.base);
        break;
      case "setMarquee":
        useSelectionStore.getState().setMarquee(effect.box);
        break;
      case "openTextEditor":
        useTextEditorStore.getState().startEditing({
          x: effect.x,
          y: effect.y,
          elementId: effect.elementId,
          initial: effect.initial,
        });
        break;
      case "switchTool":
        useToolStore.getState().setTool(effect.tool);
        break;
    }
  }
}

/**
 * Drives the pure tool handlers: converts pointer events to world-space
 * input, feeds them to the active handler, and dispatches the resulting
 * effects to the stores. The in-progress preview element lives in a ref —
 * never in the store — and is read by the canvas render loop.
 */
export function useToolSession() {
  const gestureRef = useRef<ActiveGesture | null>(null);
  const previewRef = useRef<Element | null>(null);

  const getPreview = useCallback(() => previewRef.current, []);

  const apply = useCallback(
    (handler: ToolHandler<unknown>, result: ToolResult<unknown>) => {
      gestureRef.current =
        result.session === null ? null : { handler, session: result.session };
      previewRef.current = result.preview ?? null;

      if (result.effects && result.effects.length > 0) {
        runEffects(result.effects);
      }
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const resolved = resolvePointerDown(
        useToolStore.getState().tool,
        buildInput(e),
        buildContext(),
      );

      if (resolved) {
        apply(resolved.handler, resolved.result);
      }
    },
    [apply],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const gesture = gestureRef.current;
      if (!gesture) return;

      apply(
        gesture.handler,
        gesture.handler.onPointerMove(
          gesture.session,
          buildInput(e),
          buildContext(),
        ),
      );
    },
    [apply],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const gesture = gestureRef.current;
      if (!gesture) return;

      apply(
        gesture.handler,
        gesture.handler.onPointerUp(
          gesture.session,
          buildInput(e),
          buildContext(),
        ),
      );
    },
    [apply],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const result = resolveDoubleClick(
        useToolStore.getState().tool,
        buildInput(e),
        buildContext(),
      );

      if (result?.effects) {
        runEffects(result.effects);
      }
    },
    [],
  );

  return {
    getPreview,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  };
}
