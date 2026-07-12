import { generateUUID } from "../../../lib/utils";
import type { ArrowBinding, Element, Point } from "../models/element";
import { translateElement } from "./mutations/translateElements";

export interface ClipboardPayload {
  elements: Element[];
}

/**
 * Snapshot the selected elements for copying. Returns null when the
 * selection is empty. The snapshot is deep-copied so later board edits
 * cannot mutate what was copied.
 */
export function serializeSelection(
  elements: Element[],
  ids: string[],
): ClipboardPayload | null {
  if (ids.length === 0) return null;

  const idSet = new Set(ids);
  const selected = elements.filter((element) => idSet.has(element.id));

  if (selected.length === 0) return null;

  return { elements: structuredClone(selected) };
}

function remapBinding(
  binding: ArrowBinding | undefined,
  idMap: Map<string, string>,
): ArrowBinding | undefined {
  if (!binding) return undefined;

  const mappedId = idMap.get(binding.elementId);

  // A binding only survives when its target is part of the same payload;
  // otherwise the pasted arrow would snap back onto the original element.
  if (!mappedId) return undefined;

  return { ...binding, elementId: mappedId };
}

/**
 * Turn a clipboard payload into fresh elements: new ids, translated by
 * `offset`, with arrow bindings remapped onto co-pasted targets (and
 * dropped when the target was not copied).
 */
export function materializeClipboard(
  payload: ClipboardPayload,
  offset: Point = { x: 20, y: 20 },
  newId: () => string = generateUUID,
  now = Date.now(),
): Element[] {
  const idMap = new Map<string, string>(
    payload.elements.map((element) => [element.id, newId()]),
  );

  return payload.elements.map((element) => {
    // translateElement detaches arrow bindings, so remap from the source.
    const moved = translateElement(element, offset.x, offset.y, now);

    const clone: Element = {
      ...moved,
      id: idMap.get(element.id)!,
      createdAt: now,
      updatedAt: now,
    };

    if (clone.type === "arrow" && element.type === "arrow") {
      return {
        ...clone,
        startBinding: remapBinding(element.startBinding, idMap),
        endBinding: remapBinding(element.endBinding, idMap),
      };
    }

    return clone;
  });
}
