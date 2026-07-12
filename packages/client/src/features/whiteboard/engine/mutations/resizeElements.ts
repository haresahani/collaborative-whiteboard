import type { Element } from "../../models/element";
import type { Handle } from "../geometry/resizeHandles";
import { updateAllArrowBindings } from "../bindings/updateArrowBindings";

function resizeRectangle(
  element: Element & { type: "rectangle" },
  handle: Handle,
  dx: number,
  dy: number,
  now: number,
): Element {
  let { x, y, width, height } = element;

  if (handle.includes("w")) {
    x += dx;
    width -= dx;
  }
  if (handle.includes("e")) {
    width += dx;
  }
  if (handle.includes("n")) {
    y += dy;
    height -= dy;
  }
  if (handle.includes("s")) {
    height += dy;
  }

  if (width < 0) {
    x += width;
    width = Math.abs(width);
  }

  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }

  return { ...element, x, y, width, height, updatedAt: now };
}

function resizeArrow(
  element: Element & { type: "arrow" },
  handle: Handle,
  dx: number,
  dy: number,
  now: number,
): Element {
  const { x1, y1, x2, y2 } = element;

  const x1IsMin = x1 <= x2;
  const y1IsMin = y1 <= y2;

  let nx1 = x1;
  let ny1 = y1;
  let nx2 = x2;
  let ny2 = y2;

  if (handle.includes("w")) {
    if (x1IsMin) nx1 += dx;
    else nx2 += dx;
  }
  if (handle.includes("e")) {
    if (x1IsMin) nx2 += dx;
    else nx1 += dx;
  }
  if (handle.includes("n")) {
    if (y1IsMin) ny1 += dy;
    else ny2 += dy;
  }
  if (handle.includes("s")) {
    if (y1IsMin) ny2 += dy;
    else ny1 += dy;
  }

  return {
    ...element,
    x1: nx1,
    y1: ny1,
    x2: nx2,
    y2: ny2,
    x: Math.min(nx1, nx2),
    y: Math.min(ny1, ny2),
    // Resizing an arrow edits its endpoints; detach any bindings.
    startBinding: undefined,
    endBinding: undefined,
    updatedAt: now,
  };
}

/**
 * Resize the elements in `ids` by dragging `handle` by (dx, dy). Rectangles
 * resize edge-wise (flipping through zero size); arrows remap the endpoint
 * nearest the dragged edge and detach their bindings. Strokes and text keep
 * their size. Bound arrows follow resized shapes.
 */
export function resizeElements(
  elements: Element[],
  ids: string[],
  handle: Handle,
  dx: number,
  dy: number,
  now = Date.now(),
): Element[] {
  if (ids.length === 0 || (dx === 0 && dy === 0)) return elements;

  const idSet = new Set(ids);
  let changed = false;

  const next = elements.map((element) => {
    if (!idSet.has(element.id)) return element;

    if (element.type === "rectangle") {
      changed = true;
      return resizeRectangle(element, handle, dx, dy, now);
    }

    if (element.type === "arrow") {
      changed = true;
      return resizeArrow(element, handle, dx, dy, now);
    }

    return element;
  });

  if (!changed) return elements;

  return updateAllArrowBindings(next);
}
