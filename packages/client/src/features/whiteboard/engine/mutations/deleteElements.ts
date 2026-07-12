import type { Element } from "../../models/element";

/**
 * Remove the elements in `ids`. Arrows that were bound to a deleted element
 * lose that binding (instead of keeping a dangling reference). Returns the
 * input array unchanged when nothing was deleted.
 */
export function deleteElements(
  elements: Element[],
  ids: string[],
  now = Date.now(),
): Element[] {
  if (ids.length === 0) return elements;

  const idSet = new Set(ids);
  const remaining = elements.filter((element) => !idSet.has(element.id));

  if (remaining.length === elements.length) return elements;

  return remaining.map((element) => {
    if (element.type !== "arrow") return element;

    const dropStart =
      element.startBinding && idSet.has(element.startBinding.elementId);
    const dropEnd =
      element.endBinding && idSet.has(element.endBinding.elementId);

    if (!dropStart && !dropEnd) return element;

    return {
      ...element,
      startBinding: dropStart ? undefined : element.startBinding,
      endBinding: dropEnd ? undefined : element.endBinding,
      updatedAt: now,
    };
  });
}
