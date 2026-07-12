import type { Element } from "../../models/element";
import { updateAllArrowBindings } from "../bindings/updateArrowBindings";

/**
 * Translate a single element by (dx, dy). Arrows detach their bindings:
 * explicitly moving an arrow means it should no longer be glued to a shape
 * (matches canvas drag behavior).
 */
export function translateElement(
  element: Element,
  dx: number,
  dy: number,
  now = Date.now(),
): Element {
  if (element.type === "stroke") {
    return {
      ...element,
      x: element.x + dx,
      y: element.y + dy,
      points: element.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy,
      })),
      updatedAt: now,
    };
  }

  if (element.type === "arrow") {
    return {
      ...element,
      x: element.x + dx,
      y: element.y + dy,
      x1: element.x1 + dx,
      y1: element.y1 + dy,
      x2: element.x2 + dx,
      y2: element.y2 + dy,
      startBinding: undefined,
      endBinding: undefined,
      updatedAt: now,
    };
  }

  return {
    ...element,
    x: element.x + dx,
    y: element.y + dy,
    updatedAt: now,
  };
}

/**
 * Translate every element in `ids` by (dx, dy), then re-anchor arrows bound
 * to moved elements so they follow. Returns the input array unchanged when
 * there is nothing to do.
 */
export function translateElements(
  elements: Element[],
  ids: string[],
  dx: number,
  dy: number,
  now = Date.now(),
): Element[] {
  if (ids.length === 0 || (dx === 0 && dy === 0)) return elements;

  const idSet = new Set(ids);
  let changed = false;

  const next = elements.map((element) => {
    if (!idSet.has(element.id)) return element;
    changed = true;
    return translateElement(element, dx, dy, now);
  });

  if (!changed) return elements;

  return updateAllArrowBindings(next);
}
