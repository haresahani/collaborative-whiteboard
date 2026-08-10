import { getStroke } from "perfect-freehand";
import type { Point2D } from "./sampling";

export interface BezierCurveSegment {
  p0: Point2D;
  cp1: Point2D;
  cp2: Point2D;
  p1: Point2D;
}

/**
 * Draws an organic, calligraphic freehand vector stroke using perfect-freehand curves.
 */
export function drawOrganicFreehandStroke(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  points: Point2D[],
  strokeWidth: number = 2,
  strokeColor: string = "#000000",
): void {
  if (points.length === 0) return;

  ctx.save();

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, Math.max(1, strokeWidth / 2), 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
    ctx.restore();
    return;
  }

  const strokeOutline = getStroke(
    points.map((p) => [p.x, p.y]),
    {
      size: Math.max(2, strokeWidth * 2.2),
      thinning: 0.5,
      smoothing: 0.55,
      streamline: 0.5,
      start: {
        taper: 8,
        cap: true,
      },
      end: {
        taper: 8,
        cap: true,
      },
    },
  );

  if (strokeOutline.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(strokeOutline[0][0], strokeOutline[0][1]);
    for (let i = 1; i < strokeOutline.length; i++) {
      ctx.lineTo(strokeOutline[i][0], strokeOutline[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = strokeColor;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Computes cubic Bezier control points for a series of smooth points using Catmull-Rom spline interpolation.
 */
export function computeCatmullRomBezierSegments(
  points: Point2D[],
  tension: number = 0.5,
): BezierCurveSegment[] {
  if (points.length < 2) return [];

  if (points.length === 2) {
    const p0 = points[0];
    const p1 = points[1];
    return [
      {
        p0,
        cp1: { x: p0.x + (p1.x - p0.x) / 3, y: p0.y + (p1.y - p0.y) / 3 },
        cp2: { x: p1.x - (p1.x - p0.x) / 3, y: p1.y - (p1.y - p0.y) / 3 },
        p1,
      },
    ];
  }

  const segments: BezierCurveSegment[] = [];
  const n = points.length;

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];

    const cp1: Point2D = {
      x: p1.x + ((p2.x - p0.x) / 6) * tension,
      y: p1.y + ((p2.y - p0.y) / 6) * tension,
    };

    const cp2: Point2D = {
      x: p2.x - ((p3.x - p1.x) / 6) * tension,
      y: p2.y - ((p3.y - p1.y) / 6) * tension,
    };

    segments.push({ p0: p1, cp1, cp2, p1: p2 });
  }

  return segments;
}

/**
 * Draws a smooth Catmull-Rom / Bezier stroke onto a 2D Canvas / OffscreenCanvas rendering context.
 * Identical curve math is used for both live sample points and finalized simplified points.
 */
export function drawSmoothStroke(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  points: Point2D[],
  options: {
    strokeColor?: string;
    strokeWidth?: number;
    lineCap?: CanvasLineCap;
  } = {},
): void {
  if (points.length === 0) return;

  const strokeColor = options.strokeColor || "#000000";
  const strokeWidth = options.strokeWidth || 2;
  drawOrganicFreehandStroke(ctx, points, strokeWidth, strokeColor);
}
