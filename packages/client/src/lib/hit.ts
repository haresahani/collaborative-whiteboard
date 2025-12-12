// src/lib/hit.ts
import type { DrawingElement, Point } from "@/types/whiteboard";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** small helpers */
const clamp = (v: number, a = -Infinity, b = Infinity) =>
  Math.max(a, Math.min(b, v));

export function normalizeBounds(
  position: Point,
  size: { width: number; height: number },
) {
  const width = size.width;
  const height = size.height;
  const normX = width >= 0 ? position.x : position.x + width;
  const normY = height >= 0 ? position.y : position.y + height;
  return {
    x: normX,
    y: normY,
    width: Math.abs(width),
    height: Math.abs(height),
  };
}

export function rectsIntersect(a: SelectionRect, b: SelectionRect) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** distance from point p to segment ab */
export function distanceFromSegment(p: Point, a: Point, b: Point) {
  const A = p.x - a.x;
  const B = p.y - a.y;
  const C = b.x - a.x;
  const D = b.y - a.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx: number;
  let yy: number;

  if (param < 0) {
    xx = a.x;
    yy = a.y;
  } else if (param > 1) {
    xx = b.x;
    yy = b.y;
  } else {
    xx = a.x + param * C;
    yy = a.y + param * D;
  }

  const dx = p.x - xx;
  const dy = p.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/** tiny transform helpers so hit tests don't depend on external lib */
function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Rotate point `p` around `center` by angle `rad` (radians).
 * Positive rad rotates CCW (standard).
 */
function rotatePoint(p: Point, center: Point, rad: number): Point {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/** Compute an axis-aligned bounding rect for an element (like your getElementBounds) */
export function getElementBounds(element: DrawingElement) {
  switch (element.type) {
    case "rectangle":
    case "circle":
    case "line":
    case "text":
    case "sticky-note":
      return normalizeBounds(element.position, element.size);
    case "path": {
      const data = element.data as { points?: unknown };
      if (Array.isArray(data.points) && data.points.length > 0) {
        const pts = data.points as Point[];
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
      return normalizeBounds(element.position, element.size);
    }
    default:
      return null;
  }
}

/**
 * Precise hit test for a single element, with rotation support.
 *
 * Strategy:
 *  - Rotate the test point (and line/path points) into the element's local
 *    unrotated space (apply -rotation around element center).
 *  - Perform axis-aligned bounding box / circle / segment checks in that space.
 */
export function isPointInElement(element: DrawingElement, point: Point) {
  const thresholdBase = (element.style?.strokeWidth || 2) + 4;

  // center for rotation operations
  const center = {
    x: element.position.x + element.size.width / 2,
    y: element.position.y + element.size.height / 2,
  };
  const rotRad = degToRad(element.rotation || 0);

  // helper to move any world point into element-local (unrotated) space
  const toLocal = (p: Point) =>
    element.rotation ? rotatePoint(p, center, -rotRad) : { ...p };

  // --- LINE (treat specially by rotating endpoints + point) ---
  if (element.type === "line") {
    const startWorld = element.position;
    const endWorld = {
      x: element.position.x + element.size.width,
      y: element.position.y + element.size.height,
    };

    const localPoint = toLocal(point);
    const localA = toLocal(startWorld);
    const localB = toLocal(endWorld);

    return distanceFromSegment(localPoint, localA, localB) <= thresholdBase;
  }

  // --- PATH: check distance to each segment (with rotation) then fallback to bbox ---
  if (element.type === "path") {
    const data = element.data as { points?: unknown };
    if (Array.isArray(data.points) && (data.points as Point[]).length > 0) {
      const pts = (data.points as Point[]).map(toLocal);
      const lp = toLocal(point);
      for (let i = 0; i < pts.length - 1; i++) {
        if (distanceFromSegment(lp, pts[i], pts[i + 1]) <= thresholdBase) {
          return true;
        }
      }
      // else fall through to bounding-box check
    }
  }

  // Axis-aligned bounding box check in element-local space
  const bounds = getElementBounds(element);
  if (!bounds) return false;

  const testPoint = toLocal(point);

  const withinBounds =
    testPoint.x >= bounds.x &&
    testPoint.x <= bounds.x + bounds.width &&
    testPoint.y >= bounds.y &&
    testPoint.y <= bounds.y + bounds.height;

  if (!withinBounds) return false;

  // circle needs an ellipse test in local space
  if (element.type === "circle") {
    const radiusX = bounds.width / 2 || 0.0001;
    const radiusY = bounds.height / 2 || 0.0001;
    const centerLocal = { x: bounds.x + radiusX, y: bounds.y + radiusY };
    const normalizedX = (testPoint.x - centerLocal.x) / radiusX;
    const normalizedY = (testPoint.y - centerLocal.y) / radiusY;
    return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
  }

  return true;
}

/** Finds topmost element at point (iterates from end -> start) */
export function findElementAtPoint(elements: DrawingElement[], point: Point) {
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (isPointInElement(element, point)) return element;
  }
  return null;
}
