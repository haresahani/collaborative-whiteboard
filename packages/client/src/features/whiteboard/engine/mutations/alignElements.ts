import type { Element } from "../../models/element";
import { updateAllArrowBindings } from "../bindings/updateArrowBindings";
import { alignElements as calculateAlignment, type AlignmentType } from "../geometry/alignment";
import { translateElement } from "./translateElements";

export type AlignMode = AlignmentType;

/**
 * Align or distribute the elements in `ids` mathematically within their shared selection bounds.
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

  const alignmentMap = calculateAlignment(selected, mode);
  if (alignmentMap.size === 0) return elements;

  let changed = false;

  const next = elements.map((element) => {
    if (!idSet.has(element.id)) return element;

    const targetPos = alignmentMap.get(element.id);
    if (!targetPos) return element;

    const dx = targetPos.x - element.x;
    const dy = targetPos.y - element.y;

    if (dx === 0 && dy === 0) return element;

    changed = true;
    return translateElement(element, dx, dy, now);
  });

  if (!changed) return elements;

  return updateAllArrowBindings(next);
}

