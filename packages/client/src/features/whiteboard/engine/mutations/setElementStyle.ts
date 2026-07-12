import type { Element, LineStyle } from "../../models/element";

export interface ElementStylePatch {
  /** Applies to every element type (text uses it as its text color). */
  strokeColor?: string;
  /** Applies to every element type except text. */
  strokeWidth?: number;
  /** Applies to every element type except text. */
  lineStyle?: LineStyle;
  /** Applies to rectangles only. */
  fillColor?: string;
  /** Applies to text only. */
  fontFamily?: string;
  /** Applies to text only. */
  fontSize?: number;
}

function applyPatch(
  element: Element,
  patch: ElementStylePatch,
  now: number,
): Element {
  let style = element.style;
  let extra: Partial<Element> | null = null;

  if (patch.strokeColor !== undefined) {
    style = { ...style, strokeColor: patch.strokeColor };
  }

  if (element.type !== "text") {
    if (patch.strokeWidth !== undefined) {
      style = { ...style, strokeWidth: patch.strokeWidth };
    }
    if (patch.lineStyle !== undefined) {
      style = { ...style, lineStyle: patch.lineStyle };
    }
  }

  if (element.type === "rectangle" && patch.fillColor !== undefined) {
    style = { ...style, fillColor: patch.fillColor };
  }

  if (element.type === "text") {
    if (patch.fontFamily !== undefined || patch.fontSize !== undefined) {
      extra = {
        ...(patch.fontFamily !== undefined
          ? { fontFamily: patch.fontFamily }
          : null),
        ...(patch.fontSize !== undefined ? { fontSize: patch.fontSize } : null),
      };
    }
  }

  if (style === element.style && extra === null) return element;

  return {
    ...element,
    ...extra,
    style,
    updatedAt: now,
  } as Element;
}

/**
 * Apply a style patch to the elements in `ids`. Fields that do not apply to
 * an element's type are ignored for that element (fill on a stroke, font on
 * a rectangle, ...). Returns the input array unchanged when no element was
 * affected.
 */
export function setElementStyle(
  elements: Element[],
  ids: string[],
  patch: ElementStylePatch,
  now = Date.now(),
): Element[] {
  if (ids.length === 0) return elements;

  const idSet = new Set(ids);
  let changed = false;

  const next = elements.map((element) => {
    if (!idSet.has(element.id)) return element;

    const updated = applyPatch(element, patch, now);
    if (updated !== element) changed = true;
    return updated;
  });

  return changed ? next : elements;
}
