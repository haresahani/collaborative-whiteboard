import type { Element, LineStyle, Point } from "../models/element";
import type { ToolType } from "../store/toolStore";

/**
 * Pointer input in world coordinates. The hook that drives tools converts
 * from screen space before calling any handler, so tools never see the
 * viewport.
 */
export interface PointerInput {
  world: Point;
  shiftKey: boolean;
  /** Bitmask from PointerEvent.buttons (1 = primary held). */
  buttons: number;
}

/** Snapshot of the active drawing style defaults from the tool store. */
export interface ToolStyleSnapshot {
  color: string;
  fillColor: string;
  width: number;
  /** Eraser radius in world px. */
  eraserSize: number;
  lineStyle: LineStyle;
}

/**
 * Everything a tool may read. Built fresh from the stores for every pointer
 * event, so handlers never hold stale state and never import a store.
 */
export interface ToolContext {
  elements: Element[];
  selectedIds: string[];
  style: ToolStyleSnapshot;
  newId: () => string;
  now: () => number;
}

export type MarqueeBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Side effects a tool asks the host to perform. Tools compute; the hook
 * dispatches. This is the only channel from logic to stores.
 */
export type ToolEffect =
  | { type: "setSelection"; ids: string[] }
  | { type: "addToSelection"; id: string }
  /** Replace elements WITHOUT history — live frames during a gesture. */
  | { type: "setElements"; elements: Element[] }
  /**
   * Replace elements WITH a history entry. `base` overrides the snapshot
   * pushed to history (pre-gesture state); `coalesceKey` merges rapid
   * commits of one gesture into a single undo step.
   */
  | {
      type: "commit";
      elements: Element[];
      coalesceKey?: string;
      base?: Element[];
    }
  | { type: "setMarquee"; box: MarqueeBox | null }
  | {
      type: "openTextEditor";
      x: number;
      y: number;
      elementId?: string | null;
      initial?: string;
    }
  | { type: "switchTool"; tool: ToolType };

export interface ToolResult<S> {
  /** Next session state; null ends the gesture. */
  session: S | null;
  /** In-progress element rendered on top of the board (never in the store). */
  preview?: Element | null;
  effects?: ToolEffect[];
}

/**
 * A pure pointer state machine for one interaction mode. `onPointerDown`
 * returning a null session means the handler declined the gesture and the
 * registry may try the next candidate (e.g. resize -> move -> marquee for
 * the select tool).
 */
export interface ToolHandler<S = unknown> {
  onPointerDown(input: PointerInput, ctx: ToolContext): ToolResult<S>;
  onPointerMove(session: S, input: PointerInput, ctx: ToolContext): ToolResult<S>;
  onPointerUp(session: S, input: PointerInput, ctx: ToolContext): ToolResult<S>;
}
