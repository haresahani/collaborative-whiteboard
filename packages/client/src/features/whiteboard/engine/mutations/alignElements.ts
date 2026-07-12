import type { Element } from "../../models/element";
import { getBounds, getSelectionBounds } from "../geometry/bounds";
import { updateAllArrowBindings } from "../bindings/updateArrowBindings";
import { translateElement } from "./translateElements";

export type AlignMode = "left" | "center" | "right";

/**
 * Align the elements in `ids` horizontally within their shared selection
 * bounds. Aligning fewer than two elements is a no-op (a single element is
 * always "aligned" with itself), and the input array is returned unchanged.
 */
export function alignElements(
  elements: Element[],
  ids: string[],
  mode: AlignMode,
  now = Date.now(),
): Element[] {
  if (ids.length < 2) return elements;

  const idSet = new Set(ids);
  const selected = elements.filter((element) => idSet.has(element.id));

  if (selected.length < 2) return elements;

  const selectionBounds = getSelectionBounds(selected);
  let changed = false;

  const next = elements.map((element) => {
    if (!idSet.has(element.id)) return element;

    const elementBounds = getBounds(element);
    const currentCenter = elementBounds.x + elementBounds.width / 2;
    const targetCenter = (selectionBounds.minX + selectionBounds.maxX) / 2;

    let dx = 0;

    if (mode === "left") {
      dx = selectionBounds.minX - elementBounds.x;
    } else if (mode === "center") {
      dx = targetCenter - currentCenter;
    } else {
      dx = selectionBounds.maxX - (elementBounds.x + elementBounds.width);
    }

    if (dx === 0) return element;

    changed = true;
    return translateElement(element, dx, 0, now);
  });

  if (!changed) return elements;

  return updateAllArrowBindings(next);
}
