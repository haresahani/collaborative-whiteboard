import { renderElements } from "./renderer";
import type { Element } from "../models/element";

let offscreenCanvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

export interface RenderWorkerInitMessage {
  type: "init";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
}

export interface RenderWorkerResizeMessage {
  type: "resize";
  width: number;
  height: number;
}

export interface RenderWorkerRenderMessage {
  type: "render";
  elements: Element[];
  tempElement: Element | null;
  offsetX: number;
  offsetY: number;
  zoom: number;
  selectedIds: string[];
  marquee: { x: number; y: number; width: number; height: number } | null;
  otherTempElements: Element[];
  width: number;
  height: number;
}

export type RenderWorkerMessage =
  | RenderWorkerInitMessage
  | RenderWorkerResizeMessage
  | RenderWorkerRenderMessage;

self.onmessage = (event: MessageEvent<RenderWorkerMessage>) => {
  const data = event.data;

  if (data.type === "init") {
    offscreenCanvas = data.canvas;
    offscreenCanvas.width = data.width;
    offscreenCanvas.height = data.height;
    ctx = offscreenCanvas.getContext("2d");
    return;
  }

  if (data.type === "resize" && offscreenCanvas) {
    offscreenCanvas.width = data.width;
    offscreenCanvas.height = data.height;
    return;
  }

  if (data.type === "render" && ctx && offscreenCanvas) {
    if (
      offscreenCanvas.width !== data.width ||
      offscreenCanvas.height !== data.height
    ) {
      offscreenCanvas.width = data.width;
      offscreenCanvas.height = data.height;
    }

    renderElements(
      ctx,
      data.elements,
      data.tempElement,
      data.offsetX,
      data.offsetY,
      data.zoom,
      data.selectedIds,
      data.marquee,
      data.otherTempElements,
    );
  }
};
