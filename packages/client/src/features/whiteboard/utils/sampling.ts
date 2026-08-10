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
