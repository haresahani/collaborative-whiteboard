import { getBounds } from "../../engine/geometry/bounds";
import { hitTestStroke } from "../../engine/geometry/hitTest";
import type { ArrowElement, Element, Point } from "../../models/element";

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = start.x + t * dx;
  const closestY = start.y + t * dy;

  return Math.hypot(point.x - closestX, point.y - closestY);
}

function hitsArrow(point: Point, arrow: ArrowElement, radius: number) {
  return (
    distanceToSegment(
      point,
      { x: arrow.x1, y: arrow.y1 },
      { x: arrow.x2, y: arrow.y2 },
    ) <=
    radius + Math.max(arrow.style.strokeWidth / 2, 2)
  );
}

function hitsBox(point: Point, element: Element, radius: number) {
  const bounds = getBounds(element);

  return (
    point.x >= bounds.x - radius &&
    point.x <= bounds.x + bounds.width + radius &&
    point.y >= bounds.y - radius &&
    point.y <= bounds.y + bounds.height + radius
  );
}

export function getEraserRadius(width: number) {
  return Math.max(10, width * 4);
}

export function elementHitsEraser(
  point: Point,
  element: Element,
  radius: number,
) {
  if (element.type === "stroke") {
    return hitTestStroke(
      point.x,
      point.y,
      element,
      radius + Math.max(element.style.strokeWidth / 2, 4),
    );
  }

  if (element.type === "arrow") {
    return hitsArrow(point, element, radius);
  }

  return hitsBox(point, element, radius);
}

export function getElementsTouchedByEraser(
  elements: Element[],
  point: Point,
  radius: number,
) {
  return elements.filter((element) =>
    elementHitsEraser(point, element, radius),
  );
}
