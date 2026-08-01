import type {
  StrokeElement,
  RectangleElement,
  EllipseElement,
  PathElement,
  StickyElement,
} from "../../models/element";

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

  return true;
}

export function hitTestEllipse(x: number, y: number, ellipse: EllipseElement) {
  const cx = ellipse.x + ellipse.width / 2;
  const cy = ellipse.y + ellipse.height / 2;
  const rx = Math.abs(ellipse.width) / 2;
  const ry = Math.abs(ellipse.height) / 2;

  if (rx === 0 || ry === 0) return false;

  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;

  return dx * dx + dy * dy <= 1;
}

export function hitTestPath(x: number, y: number, path: PathElement) {
  if (!path.points || path.points.length === 0) return false;
  const strokeProxy: StrokeElement = {
    ...path,
    type: "stroke",
    points: path.points,
  };
  return hitTestStroke(x, y, strokeProxy, 10);
}

export function hitTestSticky(x: number, y: number, sticky: StickyElement) {
  const rectProxy: RectangleElement = {
    ...sticky,
    type: "rectangle",
  };
  return hitTestRectangle(x, y, rectProxy);
}
