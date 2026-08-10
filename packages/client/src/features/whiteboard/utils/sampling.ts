export interface Point2D {
  x: number;
  y: number;
}

/**
 * Samples a new point against an array of existing points.
 * Returns a new array with newPoint appended if distance to the last point >= minDistance.
 */
export function samplePoint(
  points: Point2D[],
  newPoint: Point2D,
  minDistance = 1.2
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
 * Perpendicular distance from point pt to line segment (lineStart, lineEnd).
 */
function perpendicularDistance(
  pt: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    const px = pt.x - lineStart.x;
    const py = pt.y - lineStart.y;
    return Math.hypot(px, py);
  }

  const num = Math.abs(
    dy * pt.x - dx * pt.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  const den = Math.hypot(dx, dy);
  return num / den;
}

/**
 * Ramer-Douglas-Peucker algorithm to simplify stroke points given epsilon tolerance.
 */
export function simplifyRDP(points: Point2D[], epsilon = 1.0): Point2D[] {
  if (points.length <= 2) return points;

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const recResults1 = simplifyRDP(points.slice(0, index + 1), epsilon);
    const recResults2 = simplifyRDP(points.slice(index), epsilon);
    return [...recResults1.slice(0, -1), ...recResults2];
  } else {
    return [points[0], points[end]];
  }
}
