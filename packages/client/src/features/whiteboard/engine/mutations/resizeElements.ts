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

function resizeStrokeOrPath(
  element: Element & ({ type: "stroke" } | { type: "path" }),
  handle: Handle,
  dx: number,
  dy: number,
  now: number,
): Element {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const points = (element as any).points as { x: number; y: number }[] | undefined;
  if (!points || points.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return resizeRectangle(element as any, handle, dx, dy, now);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }

  const oldW = Math.max(1, maxX - minX);
  const oldH = Math.max(1, maxY - minY);
  const oldX = minX;
  const oldY = minY;

  let newX = oldX;
  let newY = oldY;
  let newW = oldW;
  let newH = oldH;

  if (handle.includes("w")) {
    newX += dx;
    newW -= dx;
  }
  if (handle.includes("e")) {
    newW += dx;
  }
  if (handle.includes("n")) {
    newY += dy;
    newH -= dy;
  }
  if (handle.includes("s")) {
    newH += dy;
  }

  if (newW < 2) newW = 2;
  if (newH < 2) newH = 2;

  const scaleX = newW / oldW;
  const scaleY = newH / oldH;

  const newPoints = points.map((pt) => ({
    ...pt,
    x: newX + (pt.x - oldX) * scaleX,
    y: newY + (pt.y - oldY) * scaleY,
  }));

  return {
    ...element,
    x: newX,
    y: newY,
    width: newW,
    height: newH,
    points: newPoints,
    updatedAt: now,
  } as Element;
}

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

    if (element.type === "stroke" || element.type === "path") {
      changed = true;
      return resizeStrokeOrPath(
        element as Element & ({ type: "stroke" } | { type: "path" }),
        handle,
        dx,
        dy,
        now,
      );
    }

    if (
      element.type === "rectangle" ||
      element.type === "image" ||
      element.type === "ellipse"
    ) {
      changed = true;
      return resizeRectangle(element as Element & { type: "rectangle" }, handle, dx, dy, now);
    }

    if (element.type === "text") {
      changed = true;
      return resizeText(element, handle, dx, dy, now);
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

function resizeText(
  element: Element & { type: "text" },
  handle: Handle,
  dx: number,
  dy: number,
  now: number,
): Element {
  const oldWidth = Math.max(10, element.width || 20);
  const oldHeight = Math.max(10, element.height || 20);

  let scale = 1;
  let newX = element.x;
  let newY = element.y;

  switch (handle) {
    case "se": {
      const scaleX = (oldWidth + dx) / oldWidth;
      const scaleY = (oldHeight + dy) / oldHeight;
      scale = Math.abs(dx) > Math.abs(dy) ? scaleX : scaleY;
      break;
    }
    case "sw": {
      const scaleX = (oldWidth - dx) / oldWidth;
      const scaleY = (oldHeight + dy) / oldHeight;
      scale = Math.abs(dx) > Math.abs(dy) ? scaleX : scaleY;
      if (scale > 0) newX = element.x + (oldWidth - oldWidth * scale);
      break;
    }
    case "ne": {
      const scaleX = (oldWidth + dx) / oldWidth;
      const scaleY = (oldHeight - dy) / oldHeight;
      scale = Math.abs(dx) > Math.abs(dy) ? scaleX : scaleY;
      if (scale > 0) newY = element.y + (oldHeight - oldHeight * scale);
      break;
    }
    case "nw": {
      const scaleX = (oldWidth - dx) / oldWidth;
      const scaleY = (oldHeight - dy) / oldHeight;
      scale = Math.abs(dx) > Math.abs(dy) ? scaleX : scaleY;
      if (scale > 0) {
        newX = element.x + (oldWidth - oldWidth * scale);
        newY = element.y + (oldHeight - oldHeight * scale);
      }
      break;
    }
    case "e":
    case "w": {
      const delta = handle === "e" ? dx : -dx;
      scale = (oldWidth + delta) / oldWidth;
      if (handle === "w" && scale > 0) {
        newX = element.x + (oldWidth - oldWidth * scale);
      }
      break;
    }
    case "n":
    case "s": {
      const delta = handle === "s" ? dy : -dy;
      scale = (oldHeight + delta) / oldHeight;
      if (handle === "n" && scale > 0) {
        newY = element.y + (oldHeight - oldHeight * scale);
      }
      break;
    }
  }

  if (!isFinite(scale) || scale <= 0) return element;

  const rawFontSize = element.fontSize * scale;
  const newFontSize = Math.max(8, Math.min(200, Math.round(rawFontSize)));

  const canvas =
    typeof document !== "undefined" ? document.createElement("canvas") : null;
  const ctx = canvas?.getContext("2d");
  let measuredWidth = oldWidth * scale;
  let measuredHeight = oldHeight * scale;

  if (ctx) {
    ctx.font = `${newFontSize}px ${element.fontFamily || "sans-serif"}`;
    const lines = (element.text || "").split("\n");
    let maxLineWidth = 0;
    for (const line of lines) {
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line || " ").width);
    }
    measuredWidth = Math.max(12, maxLineWidth);
    measuredHeight = Math.max(12, lines.length * newFontSize * 1.2);
  }

  return {
    ...element,
    x: newX,
    y: newY,
    width: measuredWidth,
    height: measuredHeight,
    fontSize: newFontSize,
    updatedAt: now,
  };
}
