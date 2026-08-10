import type { Element } from "../models/element";
// import { drawSmoothStroke } from "./smoothing";
import { renderGrid, type GridStyle } from "./grid";
import { getSelectionBounds, isElementVisibleInViewport } from "./geometry/bounds";
import { drawElement } from "./shapes/shapeRegistry";

export function normalizeBox(box: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const x = Math.min(box.x, box.x + box.width);
  const y = Math.min(box.y, box.y + box.height);

  const width = Math.abs(box.width);
  const height = Math.abs(box.height);

  return { x, y, width, height };
}

/*
----------------------------------------
Selection Bounding Box
----------------------------------------
*/
function drawSelectionBox(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  elements: Element[],
  selectedIds: string[],
) {
  if (selectedIds.length === 0) return;

  const selectedElements = elements.filter((e) => selectedIds.includes(e.id));

  if (selectedElements.length === 0) return;

  const { minX, minY, maxX, maxY } = getSelectionBounds(selectedElements);

  ctx.save();

  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);

  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

  ctx.restore();

  drawResizeHandles(ctx, minX, minY, maxX, maxY);
}

// Marquee Box
export function renderMarquee(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
) {
  ctx.save();

  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = "#4A90E2";

  ctx.strokeRect(box.x, box.y, box.width, box.height);

  ctx.restore();
}

/*
----------------------------------------
Resize Handles
----------------------------------------
*/
function drawResizeHandles(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
) {
  const size = 8;

  const points = [
    [minX, minY],
    [(minX + maxX) / 2, minY],
    [maxX, minY],

    [minX, (minY + maxY) / 2],
    [maxX, (minY + maxY) / 2],

    [minX, maxY],
    [(minX + maxX) / 2, maxY],
    [maxX, maxY],
  ];

  ctx.save();

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1.5;

  for (const [x, y] of points) {
    ctx.beginPath();
    ctx.rect(x - size / 2, y - size / 2, size, size);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/*
----------------------------------------
Main Renderer
----------------------------------------
*/

export function renderElements(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  elements: Element[],
  tempElement: Element | null,
  offsetX = 0,
  offsetY = 0,
  zoom = 1,
  selectedIds: string[] = [],
  marquee: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null,
  otherTempElements: Element[] = [],
  isDark = false,
  gridStyle: GridStyle = "dots",
) {
  const canvas = ctx.canvas;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderGrid(ctx, cssWidth, cssHeight, offsetX, offsetY, zoom, isDark, gridStyle);

  // Exact High-DPI World Transform Matrix Math
  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, offsetX * dpr, offsetY * dpr);

  for (const element of elements) {
    if ((element as unknown as Record<string, unknown>).tombstoned) continue;

    // Viewport Frustum Culling Math
    if (
      !isElementVisibleInViewport(
        element,
        cssWidth,
        cssHeight,
        offsetX,
        offsetY,
        zoom,
      )
    ) {
      continue;
    }

    const selected = selectedIds.includes(element.id);
    drawElement(ctx, element, selected);
  }

  // Renderer temporary element (local user preview)
  if (tempElement) {
    drawElement(ctx, tempElement, false);
  }

  // Render temporary elements from remote collaborators (live preview)
  for (const remoteTemp of otherTempElements) {
    drawElement(ctx, remoteTemp, false);
  }

  drawSelectionBox(ctx, elements, selectedIds);

  if (marquee) {
    renderMarquee(ctx, marquee);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

