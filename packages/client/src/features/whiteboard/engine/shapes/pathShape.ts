import type { PathElement } from "../../models/element";
import { hitTestPath } from "../geometry/hitTest";
import type { Shape } from "./Shape";
import { applyLineStyle } from "./applyLineStyle";

export const pathShape: Shape<PathElement> = {
  draw(ctx, path, selected) {
    if (!path.points || path.points.length === 0) return;

    const { strokeColor, strokeWidth, fillColor, lineStyle } = path.style;

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    applyLineStyle(ctx, lineStyle, strokeWidth);

    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    ctx.stroke();

    if (selected) {
      const bounds = this.getBounds(path);
      ctx.setLineDash([]);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = strokeWidth + 2;
      ctx.strokeRect(
        bounds.minX - 4,
        bounds.minY - 4,
        bounds.maxX - bounds.minX + 8,
        bounds.maxY - bounds.minY + 8,
      );
    }
  },

  hitTest(x, y, path) {
    return hitTestPath(x, y, path);
  },

  getBounds(path) {
    if (!path.points || path.points.length === 0) {
      return { minX: path.x, minY: path.y, maxX: path.x, maxY: path.y };
    }
    let minX = path.points[0].x;
    let minY = path.points[0].y;
    let maxX = path.points[0].x;
    let maxY = path.points[0].y;

    for (const p of path.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return { minX, minY, maxX, maxY };
  },
};
