import type { ArrowElement } from "../../models/element";
import type { Shape } from "./Shape";
import { applyLineStyle } from "./applyLineStyle";

export const arrowShape: Shape<ArrowElement> = {
  draw(ctx, arrow) {
    const { x1, y1, x2, y2, style } = arrow;

    // const headLength = 12;
    const headLength = Math.max(10, style.strokeWidth * 4);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();

    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    applyLineStyle(ctx, style.lineStyle, style.strokeWidth);

    // main line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // arrow head
    ctx.beginPath();

    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6),
    );

    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6),
    );

    ctx.stroke();

    ctx.restore();
  },

  hitTest(x, y, arrow) {
    const { x1, y1, x2, y2 } = arrow;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return false;

    const t = ((x - x1) * dx + (y - y1) * dy) / (length * length);

    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    const dist = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);

    return dist < 6;
  },

  getBounds(arrow) {
    const minX = Math.min(arrow.x1, arrow.x2);
    const minY = Math.min(arrow.y1, arrow.y2);

    const maxX = Math.max(arrow.x1, arrow.x2);
    const maxY = Math.max(arrow.y1, arrow.y2);

    return { minX, minY, maxX, maxY };
  },
};
