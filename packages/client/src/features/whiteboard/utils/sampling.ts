export interface Point2D {
  x: number;
  y: number;
}

/**
 * Filters out points that are closer than minDistance to the previous sampled point.
 */
export function samplePoint(
  points: Point2D[],
  newPoint: Point2D,
  minDistance: number = 2.5,
): Point2D[] {
  if (points.length === 0) {
    return [newPoint];
  }

  const last = points[points.length - 1];
  const dx = newPoint.x - last.x;
  const dy = newPoint.y - last.y;
  const distSq = dx * dx + dy * dy;

  if (distSq >= minDistance * minDistance) {
    return [...points, newPoint];
  }

  return points;
}

/**
 * Calculates perpendicular distance from point p to line segment (p1, p2).
 */
function perpendicularDistance(p: Point2D, p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  if (dx === 0 && dy === 0) {
    const dpx = p.x - p1.x;
    const dpy = p.y - p1.y;
    return Math.hypot(dpx, dpy);
  }

  const num = Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x);
  const den = Math.hypot(dx, dy);
  return num / den;
}

/**
 * Simplifies a polyline of 2D points using the Ramer-Douglas-Peucker (RDP) algorithm.
 * Significantly reduces point count while preserving curve shape.
 */
export function simplifyRDP(
  points: Point2D[],
  epsilon: number = 1.2,
): Point2D[] {
  if (points.length <= 2) {
    return points;
  }

  let maxDistance = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDistance) {
      maxDistance = d;
      maxIndex = i;
    }
  }

  if (maxDistance > epsilon) {
    const left = simplifyRDP(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyRDP(points.slice(maxIndex), epsilon);
    return [...left.slice(0, left.length - 1), ...right];
  }

  return [points[0], points[end]];
}
