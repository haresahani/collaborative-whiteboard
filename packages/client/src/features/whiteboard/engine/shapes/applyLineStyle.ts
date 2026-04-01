import type { LineStyle } from "../../models/element";

export function applyLineStyle(
  ctx: CanvasRenderingContext2D,
  lineStyle: LineStyle | undefined,
  strokeWidth: number,
) {
  if (lineStyle === "dashed") {
    ctx.setLineDash([
      Math.max(8, strokeWidth * 3.5),
      Math.max(6, strokeWidth * 2.4),
    ]);
    return;
  }

  if (lineStyle === "dotted") {
    ctx.setLineDash([1, Math.max(5, strokeWidth * 2.2)]);
    return;
  }

  ctx.setLineDash([]);
}
