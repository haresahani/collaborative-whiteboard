/**
 * Convert between protocol ops (docs/protocol.md) and DrawingElements.
 * Bidirectional: element → op payload, op payload → element/action.
 */

import type { DrawingElement, Point } from "@/types/whiteboard";
import type { OpPayloadData } from "@/types/protocol";

export type OpApplyResult =
  | { action: "add"; element: DrawingElement }
  | { action: "update"; id: string; updates: Partial<DrawingElement> }
  | { action: "delete"; id: string };

/**
 * Apply an op.broadcast payload to produce a state update.
 */
export function applyOpPayload(payload: OpPayloadData): OpApplyResult | null {
  const { type, data } = payload;
  switch (type) {
    case "stroke.add": {
      const points = (data.points as number[][])?.map(([x, y]) => ({ x, y }));
      const strokeId = (data.strokeId as string) ?? `path-${Date.now()}`;
      if (!points || points.length < 2) return null;
      const element: DrawingElement = {
        id: strokeId,
        type: "path",
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        rotation: 0,
        style: {
          stroke: (data.color as string) ?? "#000000",
          strokeWidth: (data.width as number) ?? 2,
          fill: "transparent",
          opacity: 1,
        },
        data: { points, smooth: data.smooth ?? true },
        createdBy: (data.actorId as string) ?? "unknown",
        createdAt: (data.createdAt as number) ?? Date.now(),
        updatedAt: Date.now(),
      };
      return { action: "add", element };
    }
    case "stroke.delete": {
      const strokeId = data.strokeId as string;
      if (!strokeId) return null;
      return { action: "delete", id: strokeId };
    }
    case "shape.add": {
      const shapeId = (data.shapeId as string) ?? `shape-${Date.now()}`;
      const shapeType = (data.type as string) ?? "rectangle";
      const element: DrawingElement = {
        id: shapeId,
        type: mapShapeType(shapeType),
        position: {
          x: (data.x as number) ?? 0,
          y: (data.y as number) ?? 0,
        },
        size: {
          width: (data.width as number) ?? 100,
          height: (data.height as number) ?? 50,
        },
        rotation: (data.rotation as number) ?? 0,
        style: {
          stroke: (data.color as string) ?? "#000000",
          strokeWidth: (data.strokeWidth as number) ?? 2,
          fill: (data.fill as string) ?? "transparent",
          opacity: (data.opacity as number) ?? 1,
        },
        data: {},
        createdBy: (data.actorId as string) ?? "unknown",
        createdAt: (data.createdAt as number) ?? Date.now(),
        updatedAt: Date.now(),
      };
      return { action: "add", element };
    }
    case "shape.transform": {
      const shapeId = data.shapeId as string;
      if (!shapeId) return null;
      const updates: Partial<DrawingElement> = {};
      if (data.x !== undefined || data.y !== undefined) {
        updates.position = {
          x: (data.x as number) ?? 0,
          y: (data.y as number) ?? 0,
        };
      }
      if (data.width !== undefined || data.height !== undefined) {
        updates.size = {
          width: (data.width as number) ?? 100,
          height: (data.height as number) ?? 50,
        };
      }
      if (data.rotation !== undefined)
        updates.rotation = data.rotation as number;
      if (Object.keys(updates).length === 0) return null;
      updates.updatedAt = Date.now();
      return { action: "update", id: shapeId, updates };
    }
    case "shape.delete": {
      const shapeId = data.shapeId as string;
      if (!shapeId) return null;
      return { action: "delete", id: shapeId };
    }
    case "note.add": {
      const noteId = (data.noteId as string) ?? `sticky-${Date.now()}`;
      const element: DrawingElement = {
        id: noteId,
        type: "sticky-note",
        position: {
          x: (data.x as number) ?? 0,
          y: (data.y as number) ?? 0,
        },
        size: { width: 200, height: 150 },
        rotation: 0,
        style: {
          stroke: "#e2e8f0",
          strokeWidth: 1,
          fill: (data.color as string) ?? "#fef08a",
          opacity: 1,
        },
        data: {
          text: (data.text as string) ?? "",
          color: (data.color as string) ?? "#fef08a",
        },
        createdBy: (data.actorId as string) ?? "unknown",
        createdAt: (data.createdAt as number) ?? Date.now(),
        updatedAt: Date.now(),
      };
      return { action: "add", element };
    }
    case "note.update": {
      const noteId = data.noteId as string;
      if (!noteId) return null;
      const updates: Partial<DrawingElement> = { updatedAt: Date.now() };
      if (data.text !== undefined)
        updates.data = { ...updates.data, text: data.text };
      if (data.x !== undefined || data.y !== undefined) {
        updates.position = {
          x: (data.x as number) ?? 0,
          y: (data.y as number) ?? 0,
        };
      }
      return { action: "update", id: noteId, updates };
    }
    case "note.delete": {
      const noteId = data.noteId as string;
      if (!noteId) return null;
      return { action: "delete", id: noteId };
    }
    case "text.add": {
      const textId = (data.textId as string) ?? `text-${Date.now()}`;
      const element: DrawingElement = {
        id: textId,
        type: "text",
        position: { x: (data.x as number) ?? 0, y: (data.y as number) ?? 0 },
        size: {
          width: (data.width as number) ?? 200,
          height: (data.height as number) ?? 40,
        },
        rotation: 0,
        style: {
          stroke: (data.color as string) ?? "#0f172a",
          strokeWidth: 1,
          fill: (data.color as string) ?? "#0f172a",
          opacity: 1,
        },
        data: {
          text: (data.text as string) ?? "",
          fontSize: (data.fontSize as number) ?? 24,
          fontFamily: (data.fontFamily as string) ?? "Inter",
          fontWeight: (data.fontWeight as string) ?? "600",
        },
        createdBy: (data.actorId as string) ?? "unknown",
        createdAt: (data.createdAt as number) ?? Date.now(),
        updatedAt: Date.now(),
      };
      return { action: "add", element };
    }
    case "text.update": {
      const textId = data.textId as string;
      if (!textId) return null;
      const updates: Partial<DrawingElement> = { updatedAt: Date.now() };
      if (data.text !== undefined)
        updates.data = { ...(updates.data as object), text: data.text };
      if (data.x !== undefined || data.y !== undefined)
        updates.position = {
          x: (data.x as number) ?? 0,
          y: (data.y as number) ?? 0,
        };
      return { action: "update", id: textId, updates };
    }
    case "stroke.chunk":
      // Chunk is optional live preview; server may echo it. Ignore or merge into pending stroke.
      return null;
    default:
      return null;
  }
}

function mapShapeType(protocolType: string): DrawingElement["type"] {
  switch (protocolType) {
    case "rectangle":
      return "rectangle";
    case "circle":
    case "ellipse":
      return "circle";
    case "line":
      return "line";
    case "text":
      return "text";
    default:
      return "rectangle";
  }
}

// --- Element → Op payload (for sending) ---

export function elementToStrokeAddPayload(
  element: DrawingElement,
  opId: string,
  actorId: string,
): OpPayloadData | null {
  if (element.type !== "path") return null;
  const points = (element.data?.points as Point[]) ?? [];
  const coords = points.map((p) => [p.x, p.y] as [number, number]);
  return {
    type: "stroke.add",
    data: {
      strokeId: element.id,
      points: coords,
      color: element.style.stroke,
      width: element.style.strokeWidth,
      smooth: element.data?.smooth ?? true,
      actorId,
      createdAt: element.createdAt,
    },
  };
}

export function elementToShapeAddPayload(
  element: DrawingElement,
  opId: string,
  actorId: string,
): OpPayloadData | null {
  if (!["rectangle", "circle", "line"].includes(element.type)) return null;
  const protocolType =
    element.type === "line"
      ? "line"
      : element.type === "circle"
        ? "circle"
        : "rectangle";
  return {
    type: "shape.add",
    data: {
      shapeId: element.id,
      type: protocolType,
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      rotation: element.rotation,
      color: element.style.stroke,
      strokeWidth: element.style.strokeWidth,
      fill: element.style.fill,
      opacity: element.style.opacity,
      actorId,
      createdAt: element.createdAt,
    },
  };
}

export function elementToNoteAddPayload(
  element: DrawingElement,
  opId: string,
  actorId: string,
): OpPayloadData | null {
  if (element.type !== "sticky-note") return null;
  return {
    type: "note.add",
    data: {
      noteId: element.id,
      x: element.position.x,
      y: element.position.y,
      text: (element.data?.text as string) ?? "",
      color: (element.data?.color as string) ?? "#fef08a",
      actorId,
      createdAt: element.createdAt,
    },
  };
}

export function elementToTextAddPayload(
  element: DrawingElement,
  _opId: string,
  actorId: string,
): OpPayloadData | null {
  if (element.type !== "text") return null;
  return {
    type: "text.add",
    data: {
      textId: element.id,
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      text: (element.data?.text as string) ?? "",
      fontSize: (element.data?.fontSize as number) ?? 24,
      fontFamily: (element.data?.fontFamily as string) ?? "Inter",
      fontWeight: (element.data?.fontWeight as string) ?? "600",
      color: element.style.stroke,
      actorId,
      createdAt: element.createdAt,
    },
  };
}

/**
 * Build op payload for any DrawingElement based on type.
 */
export function elementToOpPayload(
  element: DrawingElement,
  opId: string,
  actorId: string,
): OpPayloadData | null {
  switch (element.type) {
    case "path":
      return elementToStrokeAddPayload(element, opId, actorId);
    case "rectangle":
    case "circle":
    case "line":
      return elementToShapeAddPayload(element, opId, actorId);
    case "sticky-note":
      return elementToNoteAddPayload(element, opId, actorId);
    case "text":
      return elementToTextAddPayload(element, opId, actorId);
    default:
      return null;
  }
}

/**
 * Parse snapshot data into DrawingElement array.
 * Snapshot data may be our format or a serialized variant.
 */
export function snapshotToElements(snapshot: {
  elements?: unknown[];
}): DrawingElement[] {
  const elements = snapshot?.elements;
  if (!Array.isArray(elements)) return [];
  return elements.filter(
    (el): el is DrawingElement =>
      el !== null &&
      typeof el === "object" &&
      "id" in el &&
      "type" in el &&
      "position" in el,
  );
}
