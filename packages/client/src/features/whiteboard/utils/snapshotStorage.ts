import type { Element } from "../models/element";

export interface SnapshotElementGroups {
  strokes?: Element[];
  shapes?: Element[];
  notes?: Element[];
  elements?: Element[];
}

export function deserializeSnapshot(
  snapshotJson?: SnapshotElementGroups | Element[] | null
): Element[] {
  if (!snapshotJson) return [];

  if (Array.isArray(snapshotJson)) {
    return snapshotJson;
  }

  const result: Element[] = [];

  if (Array.isArray(snapshotJson.elements)) {
    result.push(...snapshotJson.elements);
  }
  if (Array.isArray(snapshotJson.strokes)) {
    result.push(...snapshotJson.strokes);
  }
  if (Array.isArray(snapshotJson.shapes)) {
    result.push(...snapshotJson.shapes);
  }
  if (Array.isArray(snapshotJson.notes)) {
    result.push(...snapshotJson.notes);
  }

  return result;
}
