import type { Element } from "../models/element";
import { getSelectionBounds } from "./geometry/bounds";
import { drawElement } from "./shapes/shapeRegistry";

export interface ExportOptions {
  padding?: number;
  backgroundColor?: string | null;
  includeGrid?: boolean;
}

/**
 * Calculates exact canvas bounding box math and renders exported PNG image containing all board elements.
 */
export function exportToPNG(
  elements: Element[],
  _boardName?: string,
  options: ExportOptions = {},
): string | null {
  const activeElements = elements.filter(
    (e) => !(e as unknown as Record<string, unknown>).tombstoned,
  );
  if (activeElements.length === 0) return null;

  const { minX, minY, maxX, maxY } = getSelectionBounds(activeElements);
  const padding = options.padding ?? 40;

  const contentWidth = Math.ceil(maxX - minX + padding * 2);
  const contentHeight = Math.ceil(maxY - minY + padding * 2);

  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;

  canvas.width = contentWidth * dpr;
  canvas.height = contentHeight * dpr;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Background fill
  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, contentWidth, contentHeight);
  }

  // Exact translation math to center elements inside output bounding box
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  for (const element of activeElements) {
    drawElement(ctx, element, false);
  }

  ctx.restore();

  return canvas.toDataURL("image/png");
}

/**
 * Serializes board state into JSON format for download or backup.
 */
export function exportToJSON(
  elements: Element[],
  boardName: string,
  boardId: string,
): string {
  const activeElements = elements.filter(
    (e) => !(e as unknown as Record<string, unknown>).tombstoned,
  );

  const data = {
    version: 1,
    boardId,
    boardName,
    exportedAt: new Date().toISOString(),
    elementsCount: activeElements.length,
    elements: activeElements,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Downloads a data payload with specified filename.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
