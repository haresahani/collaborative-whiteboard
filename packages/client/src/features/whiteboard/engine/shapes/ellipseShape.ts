import type { EllipseElement } from "../../models/element";
import { hitTestEllipse } from "../geometry/hitTest";
import type { Shape } from "./Shape";
import { applyLineStyle } from "./applyLineStyle";

export const ellipseShape: Shape<EllipseElement> = {
  draw(ctx, ellipse, selected) {
    const { strokeColor, strokeWidth, fillColor, lineStyle } = ellipse.style;

    const cx = ellipse.x + ellipse.width / 2;
    const cy = ellipse.y + ellipse.height / 2;
    const rx = Math.abs(ellipse.width) / 2;
    const ry = Math.abs(ellipse.height) / 2;

    if (rx === 0 || ry === 0) return;

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    applyLineStyle(ctx, lineStyle, strokeWidth);

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    ctx.stroke();

    if (selected) {
      ctx.setLineDash([]);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = strokeWidth + 2;
      ctx.strokeRect(ellipse.x, ellipse.y, ellipse.width, ellipse.height);
    }
  },

  hitTest(x, y, ellipse) {
    return hitTestEllipse(x, y, ellipse);
  },

  getBounds(ellipse) {
    return {
      minX: ellipse.x,
      minY: ellipse.y,
      maxX: ellipse.x + ellipse.width,
      maxY: ellipse.y + ellipse.height,
    };
  },
};
