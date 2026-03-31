export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Axis-aligned bounding box intersection test.
 *
 * Returns true if two rectangles overlap or touch in world space.
 * Used by marquee selection to decide which elements are inside the drag box.
 */
export function intersects(a: Box, b: Box): boolean {
  const aRight = a.x + a.width;
  const bRight = b.x + b.width;
  const aBottom = a.y + a.height;
  const bBottom = b.y + b.height;

  return !(a.x > bRight || aRight < b.x || a.y > bBottom || aBottom < b.y);
}
