import type { RectangleElement } from "../../models/element";
import { hitTestRectangle } from "../geometry/hitTest";
import type { Shape } from "./Shape";

export const rectangleShape: Shape<RectangleElement> = {
  draw(ctx, rect, selected) {
    const { strokeColor, strokeWidth } = rect.style;

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.stroke();

    if (selected) {
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
