import type { RectangleElement } from "../../models/element";
import { hitTestRectangle } from "../geometry/hitTest";
import type { Shape } from "./Shape";
import { applyLineStyle } from "./applyLineStyle";

export const rectangleShape: Shape<RectangleElement> = {
  draw(ctx, rect, selected) {
    const { strokeColor, strokeWidth, fillColor, lineStyle } = rect.style;

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    applyLineStyle(ctx, lineStyle, strokeWidth);

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    ctx.stroke();

    if (selected) {
      ctx.setLineDash([]);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = strokeWidth + 2;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  },

  hitTest(x, y, rect) {
    return hitTestRectangle(x, y, rect);
  },

  getBounds(rect) {
    return {
      minX: rect.x,
      minY: rect.y,
      maxX: rect.x + rect.width,
      maxY: rect.y + rect.height,
    };
  },
};
