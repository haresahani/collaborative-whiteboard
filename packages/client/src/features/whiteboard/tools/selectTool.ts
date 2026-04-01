import { useBoardStore } from "../store/boardStore";
import { updateArrowBindings } from "../engine/bindings/updateArrowBindings";
import type { Element } from "../models/element";

export function updateAllArrowBindings(elements: Element[]): Element[] {
  const elementsMap = new Map<string, Element>(
    elements.map((el) => [el.id, el]),
  );

  let changed = false;

  const next = elements.map((el) => {
    if (el.type !== "arrow") return el;
    const updated = updateArrowBindings(el, elementsMap);
    if (updated !== el) changed = true;
    return updated;
  });

  return changed ? next : elements;
}

export function recomputeArrowBindingsInStore() {
  useBoardStore.setState((state) => ({
    elements: updateAllArrowBindings(state.elements),
  }));
}
