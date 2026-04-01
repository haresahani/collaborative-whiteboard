import type { StrokeElement } from "../features/whiteboard/models/element";

let clipboardStroke: StrokeElement | null = null;

export function copyStroke(stroke: StrokeElement) {
  clipboardStroke = stroke;
}

export function pasteStroke(): StrokeElement | null {
  if (!clipboardStroke) return null;

  return {
    ...clipboardStroke,
    id: crypto.randomUUID(),
    points: clipboardStroke.points.map((p) => ({
      x: p.x + 20,
      y: p.y + 20,
    })),
    x: clipboardStroke.x + 20,
    y: clipboardStroke.y + 20,
    updatedAt: Date.now(),
  };
}
