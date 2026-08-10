import getStroke from "perfect-freehand";
import type { Point } from "../models/element";

export function drawSmoothStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  strokeWidth = 2,
  strokeColor = "#000000",
) {
  if (points.length < 1) return;

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
    return;
  }

  const strokePoints = getStroke(
    points.map((p) => [p.x, p.y]),
    {
      size: Math.max(strokeWidth * 2, 3),
      thinning: 0.4,
      smoothing: 0.7,
      streamline: 0.55,
      easing: (t) => t,
      start: { cap: true, taper: 0 },
      end: { cap: true, taper: 0 },
    },
  );

  if (strokePoints.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(strokePoints[0][0], strokePoints[0][1]);

  for (let i = 1; i < strokePoints.length - 1; i++) {
    const midX = (strokePoints[i][0] + strokePoints[i + 1][0]) / 2;
    const midY = (strokePoints[i][1] + strokePoints[i + 1][1]) / 2;
    ctx.quadraticCurveTo(strokePoints[i][0], strokePoints[i][1], midX, midY);
  }

  const last = strokePoints[strokePoints.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.closePath();

  ctx.fillStyle = strokeColor;
  ctx.fill();
}
