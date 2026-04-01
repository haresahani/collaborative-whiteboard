import { getBounds } from "../geometry/bounds";
import type { Element, ArrowElement } from "../../models/element";

export function updateArrowBindings(
  arrow: ArrowElement,
  elementsMap: Map<string, Element>,
) {
  let next: ArrowElement = arrow;

  if (arrow.startBinding) {
    const el = elementsMap.get(arrow.startBinding.elementId);

    if (el) {
      const bounds = getBounds(el);
      const x1 = bounds.x + bounds.width * arrow.startBinding.anchor.x;
      const y1 = bounds.y + bounds.height * arrow.startBinding.anchor.y;

      if (x1 !== next.x1 || y1 !== next.y1) {
        next = { ...next, x1, y1, updatedAt: Date.now() };
      }
    }
  }

  if (arrow.endBinding) {
    const el = elementsMap.get(arrow.endBinding.elementId);

    if (el) {
      const bounds = getBounds(el);
      const x2 = bounds.x + bounds.width * arrow.endBinding.anchor.x;
      const y2 = bounds.y + bounds.height * arrow.endBinding.anchor.y;

      if (x2 !== next.x2 || y2 !== next.y2) {
        next = { ...next, x2, y2, updatedAt: Date.now() };
      }
    }
  }

  return next;
}
