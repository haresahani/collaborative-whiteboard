import { generateUUID } from "../../../../lib/utils";
import type { Element, Point } from "../../models/element";
import { materializeClipboard, serializeSelection } from "../clipboard";

export interface DuplicateResult {
  elements: Element[];
  newIds: string[];
}

/**
 * Clone the elements in `ids`, offset so the copies don't cover the
 * originals. Arrow bindings are remapped onto the cloned targets when those
 * were duplicated as well, and dropped otherwise. (Copy and paste in one
 * step — shares the clipboard's clone logic.)
 */
export function duplicateElements(
  elements: Element[],
  ids: string[],
  offset: Point = { x: 20, y: 20 },
  newId: () => string = generateUUID,
  now = Date.now(),
): DuplicateResult {
  const payload = serializeSelection(elements, ids);

  if (!payload) return { elements, newIds: [] };

  const clones = materializeClipboard(payload, offset, newId, now);

  return {
    elements: [...elements, ...clones],
    newIds: clones.map((clone) => clone.id),
  };
}
