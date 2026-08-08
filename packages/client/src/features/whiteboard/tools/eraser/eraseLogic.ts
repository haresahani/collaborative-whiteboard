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

/**
 * Mathematical segment sampling: checks elements intersected along the trajectory from p1 to p2.
 * Ensures fast eraser swipes never skip elements.
 */
export function getElementsTouchedByEraserSegment(
  elements: Element[],
  p1: Point,
  p2: Point,
  radius: number,
) {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const stepSize = Math.max(radius * 0.5, 4);
  const steps = Math.max(1, Math.ceil(dist / stepSize));

  const touchedSet = new Set<Element>();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const samplePoint: Point = {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
    };

    for (const element of elements) {
      if (!touchedSet.has(element) && elementHitsEraser(samplePoint, element, radius)) {
        touchedSet.add(element);
      }
    }
  }

  return Array.from(touchedSet);
}

