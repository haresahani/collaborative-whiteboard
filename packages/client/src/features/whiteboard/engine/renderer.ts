import type { Element } from "../models/element";
// import { drawSmoothStroke } from "./smoothing";
import { renderGrid } from "./grid";
import { getSelectionBounds } from "./geometry/bounds";
import { useSelectionStore } from "../store/selectionStore";
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
  ctx: CanvasRenderingContext2D,
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
  ctx: CanvasRenderingContext2D,
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
  ctx: CanvasRenderingContext2D,
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
  ctx: CanvasRenderingContext2D,
  elements: Element[],
  tempElement: Element | null,
  offsetX = 0,
  offsetY = 0,
  zoom = 1,
  selectedIds: string[] = [],
) {
  const canvas = ctx.canvas;

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  renderGrid(ctx, canvas.width, canvas.height, offsetX, offsetY, zoom);

  ctx.setTransform(zoom, 0, 0, zoom, offsetX, offsetY);

  for (const element of elements) {
    const selected = selectedIds.includes(element.id);
    drawElement(ctx, element, selected);
  }

  // Renderer temporary element
  if (tempElement) {
    drawElement(ctx, tempElement, false);
  }

  drawSelectionBox(ctx, elements, selectedIds);

  const marquee = useSelectionStore.getState().marquee;
  if (marquee) {
    renderMarquee(ctx, marquee);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.globalCompositeOperation = "source-over";
}
