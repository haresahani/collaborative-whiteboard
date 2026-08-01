import type { StickyElement } from "../../models/element";
import { hitTestSticky } from "../geometry/hitTest";
import type { Shape } from "./Shape";

export const stickyShape: Shape<StickyElement> = {
  draw(ctx, sticky, selected) {
    const { x, y, width, height, color } = sticky;
    const bgColor = color || sticky.style?.fillColor || "#fff4c2";
    const radius = 6;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    // Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    // Rounded card background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = "transparent";

    // Subtle border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Folded top-right corner effect
    const foldSize = Math.min(16, width / 4, height / 4);
    ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    ctx.beginPath();
    ctx.moveTo(x + width - foldSize, y);
    ctx.lineTo(x + width, y + foldSize);
    ctx.lineTo(x + width - foldSize, y + foldSize);
    ctx.closePath();
    ctx.fill();

    // Render static text if specified (when overlay editor is not active)
    if (sticky.text) {
      ctx.fillStyle = "#1e293b";
      ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const padding = 12;
      const maxWidth = width - padding * 2;
      const lines = sticky.text.split("\n");

      let currentY = y + padding;
      for (const line of lines) {
        if (currentY + 18 > y + height - padding) break;
        ctx.fillText(
          line.length > 30 ? line.substring(0, 30) + "…" : line,
          x + padding,
          currentY,
          maxWidth,
        );
        currentY += 20;
      }
    }

    if (selected) {
      ctx.setLineDash([]);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
    }

    ctx.restore();
  },

  hitTest(x, y, sticky) {
    return hitTestSticky(x, y, sticky);
  },

  getBounds(sticky) {
    return {
      minX: sticky.x,
      minY: sticky.y,
      maxX: sticky.x + sticky.width,
      maxY: sticky.y + sticky.height,
    };
  },
};
