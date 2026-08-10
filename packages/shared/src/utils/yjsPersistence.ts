import * as Y from "yjs";

/**
 * Merges multiple binary Yjs updates into a single Uint8Array update.
 */
export function mergeYjsUpdates(updates: Uint8Array[]): Uint8Array {
  if (updates.length === 0) return new Uint8Array(0);
  if (updates.length === 1) return updates[0];
  return Y.mergeUpdates(updates);
}

/**
 * Applies an array of updates to a Y.Doc instance.
 */
export function applyUpdatesToDoc(
  doc: Y.Doc,
  updates: Uint8Array[],
  origin?: string,
): void {
  for (const update of updates) {
    if (update && update.length > 0) {
      Y.applyUpdate(doc, update, origin);
    }
  }
}

/**
 * Encodes state of a Y.Doc as a Uint8Array update.
 */
export function encodeDocState(doc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(doc);
}
