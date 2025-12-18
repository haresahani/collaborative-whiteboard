import type { DrawingElement, Point } from "@/types/whiteboard";

export type ClipboardPayload = {
  elements: DrawingElement[];
  origin: Point; // top-left of selection
};

export function cloneElements(
  elements: DrawingElement[],
  offset: Point,
  currentUserId: string,
): DrawingElement[] {
  const now = Date.now();

  return elements.map((el) => {
    const newId = `${el.type}-${now}-${Math.random().toString(36).slice(2)}`;

    // clone path points safely
    const clonedData =
      el.type === "path"
        ? {
            ...el.data,
            points: (el.data.points as Point[]).map((p) => ({
              x: p.x + offset.x,
              y: p.y + offset.y,
            })),
          }
        : { ...el.data };

    return {
      ...el,
      id: newId,
      position: {
        x: el.position.x + offset.x,
        y: el.position.y + offset.y,
      },
      data: clonedData,
      createdBy: currentUserId,
      createdAt: now,
      updatedAt: now,
    };
  });
}
