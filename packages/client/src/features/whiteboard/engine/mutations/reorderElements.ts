import type { Element } from "../../models/element";

export type ReorderMode =
  | "bringToFront"
  | "sendToBack"
  | "bringForward"
  | "sendBackward";

export function reorderElements(
  elements: Element[],
  selectedIds: string[],
  mode: ReorderMode,
  now = Date.now(),
): Element[] {
  if (elements.length <= 1 || selectedIds.length === 0) return elements;

  const selectedSet = new Set(selectedIds);
  const selectedList = elements.filter((el) => selectedSet.has(el.id));
  const unselectedList = elements.filter((el) => !selectedSet.has(el.id));

  if (selectedList.length === 0) return elements;

  let nextElements: Element[] = [];

  if (mode === "bringToFront") {
    nextElements = [...unselectedList, ...selectedList];
  } else if (mode === "sendToBack") {
    nextElements = [...selectedList, ...unselectedList];
  } else if (mode === "bringForward") {
    nextElements = [...elements];
    for (let i = nextElements.length - 2; i >= 0; i--) {
      if (
        selectedSet.has(nextElements[i].id) &&
        !selectedSet.has(nextElements[i + 1].id)
      ) {
        const temp = nextElements[i];
        nextElements[i] = nextElements[i + 1];
        nextElements[i + 1] = temp;
      }
    }
  } else if (mode === "sendBackward") {
    nextElements = [...elements];
    for (let i = 1; i < nextElements.length; i++) {
      if (
        selectedSet.has(nextElements[i].id) &&
        !selectedSet.has(nextElements[i - 1].id)
      ) {
        const temp = nextElements[i];
        nextElements[i] = nextElements[i - 1];
        nextElements[i - 1] = temp;
      }
    }
  }

  return nextElements.map((el, index) => ({
    ...el,
    zIndex: index,
    updatedAt: selectedSet.has(el.id) ? now : el.updatedAt,
  }));
}
