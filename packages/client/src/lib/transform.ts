// src/lib/transform.ts
export type Point = { x: number; y: number };

// src/lib/transform.ts
export const degToRad = (deg: number) => (deg * Math.PI) / 180;
export const radToDeg = (rad: number) => (rad * 180) / Math.PI;

/** Rotate point p around center by rad radians (positive = CCW) */
export function rotatePoint(
  p: { x: number; y: number },
  center: { x: number; y: number },
  rad: number,
) {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/** Clamp a numeric value between min and max (inclusive) */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Approx equal helper for floats */
export function approxEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}
