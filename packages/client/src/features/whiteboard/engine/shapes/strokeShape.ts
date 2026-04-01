import type { StrokeElement } from "../../models/element";
import { drawSmoothStroke } from "../smoothing";
import { hitTestStroke } from "../geometry/hitTest";
import type { Shape } from "./Shape";
import { applyLineStyle } from "./applyLineStyle";

export const strokeShape: Shape<StrokeElement> = {
  draw(ctx, stroke, selected) {
    if (stroke.points.length < 2) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { strokeColor, strokeWidth, lineStyle } = stroke.style;

    if (strokeColor === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = strokeWidth;
      ctx.setLineDash([]);
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      applyLineStyle(ctx, lineStyle, strokeWidth);
    }

    drawSmoothStroke(ctx, stroke.points);

    if (selected) {
      ctx.globalCompositeOperation = "source-over";
      ctx.setLineDash([]);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = strokeWidth + 3;
      drawSmoothStroke(ctx, stroke.points);
    }
  },

  hitTest(x, y, stroke) {
    return hitTestStroke(x, y, stroke);
  },

  getBounds(stroke) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of stroke.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    return { minX, minY, maxX, maxY };
  },
};
