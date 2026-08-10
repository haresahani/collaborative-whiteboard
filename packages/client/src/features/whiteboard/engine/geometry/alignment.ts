import type { Element } from "../../models/element";
import { getBounds } from "./bounds";

export type AlignmentType =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom"
  | "distribute-horizontal"
  | "distribute-vertical";

/**
 * Calculates new updated positions for a set of elements based on exact alignment/distribution math.
 */
export function alignElements(
  elements: Element[],
  type: AlignmentType,
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (elements.length === 0) return result;

  const elementBounds = elements.map((el) => {
    const b = getBounds(el);
    return {
      element: el,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      minX: b.x,
      minY: b.y,
      maxX: b.x + b.width,
      maxY: b.y + b.height,
      centerX: b.x + b.width / 2,
      centerY: b.y + b.height / 2,
    };
  });

  const groupMinX = Math.min(...elementBounds.map((b) => b.minX));
  const groupMaxX = Math.max(...elementBounds.map((b) => b.maxX));
  const groupMinY = Math.min(...elementBounds.map((b) => b.minY));
  const groupMaxY = Math.max(...elementBounds.map((b) => b.maxY));
  const groupCenterX = (groupMinX + groupMaxX) / 2;
  const groupCenterY = (groupMinY + groupMaxY) / 2;

  switch (type) {
    case "left":
      for (const item of elementBounds) {
        const dx = groupMinX - item.minX;
        result.set(item.element.id, {
          x: item.element.x + dx,
          y: item.element.y,
        });
      }
      break;

    case "center":
      for (const item of elementBounds) {
        const targetCenterX = groupCenterX;
        const dx = targetCenterX - item.centerX;
        result.set(item.element.id, {
          x: item.element.x + dx,
          y: item.element.y,
        });
      }
      break;

    case "right":
      for (const item of elementBounds) {
        const dx = groupMaxX - item.maxX;
        result.set(item.element.id, {
          x: item.element.x + dx,
          y: item.element.y,
        });
      }
      break;

    case "top":
      for (const item of elementBounds) {
        const dy = groupMinY - item.minY;
        result.set(item.element.id, {
          x: item.element.x,
          y: item.element.y + dy,
        });
      }
      break;

    case "middle":
      for (const item of elementBounds) {
        const targetCenterY = groupCenterY;
        const dy = targetCenterY - item.centerY;
        result.set(item.element.id, {
          x: item.element.x,
          y: item.element.y + dy,
        });
      }
      break;

    case "bottom":
      for (const item of elementBounds) {
        const dy = groupMaxY - item.maxY;
        result.set(item.element.id, {
          x: item.element.x,
          y: item.element.y + dy,
        });
      }
      break;

    case "distribute-horizontal": {
      if (elementBounds.length < 3) break;
      const sorted = [...elementBounds].sort((a, b) => a.minX - b.minX);
      const totalWidthSum = sorted.reduce((sum, item) => sum + item.width, 0);
      const totalSpan = groupMaxX - groupMinX;
      const totalGap = totalSpan - totalWidthSum;
      const gapPerItem = totalGap / (sorted.length - 1);

      let currentX = groupMinX;
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        const dx = currentX - item.minX;
        result.set(item.element.id, {
          x: item.element.x + dx,
          y: item.element.y,
        });
        currentX += item.width + gapPerItem;
      }
      break;
    }

    case "distribute-vertical": {
      if (elementBounds.length < 3) break;
      const sorted = [...elementBounds].sort((a, b) => a.minY - b.minY);
      const totalHeightSum = sorted.reduce((sum, item) => sum + item.height, 0);
      const totalSpan = groupMaxY - groupMinY;
      const totalGap = totalSpan - totalHeightSum;
      const gapPerItem = totalGap / (sorted.length - 1);

      let currentY = groupMinY;
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        const dy = currentY - item.minY;
        result.set(item.element.id, {
          x: item.element.x,
          y: item.element.y + dy,
        });
        currentY += item.height + gapPerItem;
      }
      break;
    }
  }

  return result;
}
