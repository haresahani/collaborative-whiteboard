export type Handle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

export function getCursorForHandle(handle: Handle): string {
  switch (handle) {
    case "nw":
    case "se":
      return "nwse-resize";

    case "ne":
    case "sw":
      return "nesw-resize";

    case "n":
    case "s":
      return "ns-resize";

    case "w":
    case "e":
      return "ew-resize";

    default:
      return "default";
  }
}

export function getHandleUnderPoint(
  x: number,
  y: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  size = 10,
): Handle | null {
  const handles: Record<Handle, [number, number]> = {
    nw: [bounds.minX, bounds.minY],
    n: [(bounds.minX + bounds.maxX) / 2, bounds.minY],
    ne: [bounds.maxX, bounds.minY],

    w: [bounds.minX, (bounds.minY + bounds.maxY) / 2],
    e: [bounds.maxX, (bounds.minY + bounds.maxY) / 2],

    sw: [bounds.minX, bounds.maxY],
    s: [(bounds.minX + bounds.maxX) / 2, bounds.maxY],
    se: [bounds.maxX, bounds.maxY],
  };

  for (const key in handles) {
    const [hx, hy] = handles[key as Handle];

    if (Math.abs(x - hx) < size && Math.abs(y - hy) < size) {
      return key as Handle;
    }
  }

  return null;
}
