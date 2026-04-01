import type { StrokeElement, RectangleElement } from "../../models/element";

export function hitTestStroke(
  x: number,
  y: number,
  stroke: StrokeElement,
  threshold = 6,
) {
  for (let i = 0; i < stroke.points.length - 1; i++) {
    const p1 = stroke.points[i];
    const p2 = stroke.points[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) continue;

    let dot = ((x - p1.x) * dx + (y - p1.y) * dy) / lengthSq;

    // clamp projection between segment endpoints
    dot = Math.max(0, Math.min(1, dot));

    const closestX = p1.x + dot * dx;
    const closestY = p1.y + dot * dy;

    const dist = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);

    if (dist < threshold) return true;
  }

  return false;
}

export function hitTestRectangle(x: number, y: number, rect: RectangleElement) {
  const { x: rx, y: ry, width, height } = rect;

  const minX = Math.min(rx, rx + width);
  const maxX = Math.max(rx, rx + width);
  const minY = Math.min(ry, ry + height);
  const maxY = Math.max(ry, ry + height);

  if (x < minX || x > maxX || y < minY || y > maxY) {
    return false;
  }

  // For interaction (select/drag), treat the entire rectangle bounds as hittable.
  // Stroke-only selection tends to feel broken in editors.
  return true;
}
