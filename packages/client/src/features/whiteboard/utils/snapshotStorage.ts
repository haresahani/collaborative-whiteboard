import type {
  Element,
  StrokeElement,
  RectangleElement,
  ArrowElement,
  TextElement,
} from "../models/element";

export interface SnapshotElementGroups {
  strokes: StrokeElement[];
  shapes: (RectangleElement | ArrowElement)[];
  notes: TextElement[]; // Maps notes inside snapshotJson database schema to client text elements
}

export function deserializeSnapshot(
  snapshotJson: SnapshotElementGroups | null | undefined,
): Element[] {
  if (!snapshotJson) return [];
  const strokes = snapshotJson.strokes || [];
  const shapes = snapshotJson.shapes || [];
  const notes = snapshotJson.notes || [];
  return [...strokes, ...shapes, ...notes];
}

export function serializeSnapshot(elements: Element[]): SnapshotElementGroups {
  const strokes: StrokeElement[] = [];
  const shapes: (RectangleElement | ArrowElement)[] = [];
  const notes: TextElement[] = [];

  for (const el of elements) {
    if (el.type === "stroke") {
      strokes.push(el);
    } else if (el.type === "rectangle" || el.type === "arrow") {
      shapes.push(el as RectangleElement | ArrowElement);
    } else if (el.type === "text") {
      notes.push(el);
    }
  }

  return { strokes, shapes, notes };
}
