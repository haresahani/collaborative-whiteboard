import { getBounds } from "../geometry/bounds";
import type { Element } from "../../models/element";

export function computeBindingAnchor(element: Element, x: number, y: number) {
  const bounds = getBounds(element);

  const anchorX = bounds.width === 0 ? 0 : (x - bounds.x) / bounds.width;
  const anchorY = bounds.height === 0 ? 0 : (y - bounds.y) / bounds.height;

  return {
    x: Math.max(0, Math.min(1, anchorX)),
    y: Math.max(0, Math.min(1, anchorY)),
  };
}
