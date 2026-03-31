// src/features/whiteboard/engine/shapes/textShape.ts
import type { TextElement } from "../../models/element";
import type { Shape } from "./Shape";

export const textShape: Shape<TextElement> = {
  draw(ctx, element, selected) {
    const { x, y, text, fontSize, width, height } = element;

    ctx.save();

    ctx.font = `${fontSize}px ${element.fontFamily || "sans-serif"}`;
    ctx.textBaseline = "top"; // set before drawing
    ctx.fillStyle = element.style.strokeColor;

    const lines = text.split("\n");
    const lineHeight = fontSize * 1.2;

    // draw each line
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });

    if (selected) {
      // fall back to measuring if width/height missing
      let boxWidth = width;
      let boxHeight = height;

      if (!boxWidth || !boxHeight) {
        let maxWidth = 0;
        lines.forEach((line) => {
          const metrics = ctx.measureText(line || " ");
          maxWidth = Math.max(maxWidth, metrics.width);
        });
        boxWidth = maxWidth;
        boxHeight = lines.length * lineHeight;
      }

      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 2, y - 2, boxWidth + 4, boxHeight + 4);
    }

    ctx.restore();
  },

  hitTest(px, py, element) {
    const minX = element.x;
    const minY = element.y;
    const maxX = element.x + element.width;
    const maxY = element.y + element.height;

    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  },

  getBounds(element) {
    return {
      minX: element.x,
      minY: element.y,
      maxX: element.x + element.width,
      maxY: element.y + element.height,
    };
  },
};
