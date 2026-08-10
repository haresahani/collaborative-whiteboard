import type { Element } from "../../models/element";
import { getShape } from "../shapes/shapeRegistry";

/*
---------------------------------------
Selection Bounds
---------------------------------------
*/
export function getSelectionBounds(elements: Element[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    const shape = getShape(element.type);
    if (!shape) continue;
    const bounds = shape.getBounds(element);

    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  return { minX, minY, maxX, maxY };
}

// Bounds as box {x,y,width,height}
export function getBounds(element: Element) {
  const shape = getShape(element.type);
  if (!shape) {
    throw new Error("Unknown element type");
  }
  const { minX, minY, maxX, maxY } = shape.getBounds(element);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculates whether an element's bounding box intersects the current visible screen area (Frustum Culling).
 */
export function isElementVisibleInViewport(
  element: Element,
  screenWidth: number,
  screenHeight: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
  padding = 50,
): boolean {
  const shape = getShape(element.type);
  if (!shape) return true; // fallback to true if unknown shape

  const bounds = shape.getBounds(element);

  // Convert screen boundaries to world coordinates with safety padding
  const worldMinX = (-offsetX - padding) / zoom;
  const worldMinY = (-offsetY - padding) / zoom;
  const worldMaxX = (screenWidth - offsetX + padding) / zoom;
  const worldMaxY = (screenHeight - offsetY + padding) / zoom;

  // AABB intersection check
  return (
    bounds.maxX >= worldMinX &&
    bounds.minX <= worldMaxX &&
    bounds.maxY >= worldMinY &&
    bounds.minY <= worldMaxY
  );
}

