import type { TextElement } from "../../models/element";
import type { Shape } from "./Shape";
import { useTextEditorStore } from "../../store/textEditorStore";

export const textShape: Shape<TextElement> = {
  draw(ctx, element, selected) {
    const { isEditing, elementId } = useTextEditorStore.getState();
    const isCurrentlyEditing = isEditing && elementId === element.id;

    const { x, y, text, fontSize, width, height } = element;

    ctx.save();

    ctx.font = `${fontSize}px ${element.fontFamily || "sans-serif"}`;
    ctx.textBaseline = "top"; // set before drawing
    ctx.fillStyle = element.style.strokeColor;

    const lines = text.split("\n");
    const lineHeight = fontSize * 1.2;

    // Skip drawing canvas text while actively typing inline directly on board
    if (!isCurrentlyEditing) {
      lines.forEach((line, index) => {
        ctx.fillText(line, x, y + index * lineHeight);
      });
    }

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
    const { minX, minY, maxX, maxY } = this.getBounds(element);
    return px >= minX - 4 && px <= maxX + 4 && py >= minY - 4 && py <= maxY + 4;
  },

  getBounds(element) {
    const { x, y, text, fontSize, width, height } = element;
    let boxWidth = width;
    let boxHeight = height;

    if (!boxWidth || !boxHeight || boxWidth <= 0 || boxHeight <= 0) {
      const lines = (text || "").split("\n");
      const lineHeight = fontSize * 1.2;
      const approxCharWidth = fontSize * 0.6;
      let maxLen = 0;
      for (const line of lines) {
        if (line.length > maxLen) maxLen = line.length;
      }
      boxWidth = Math.max(20, maxLen * approxCharWidth);
      boxHeight = Math.max(fontSize, lines.length * lineHeight);
    }

    return {
      minX: x,
      minY: y,
      maxX: x + boxWidth,
      maxY: y + boxHeight,
    };
  },
};
