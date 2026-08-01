import { describe, it, expect } from "vitest";
import { compareLamportClientId, type GroupClock } from "./lww";
import { applyOperation, type ISharedElement, type IOp } from "../oplog";

describe("LWW Resolution", () => {
  it("should resolve equal-lamport tie deterministically by clientId ordering", () => {
    const clockA: GroupClock = { lamport: 5, clientId: "user-alpha" };
    const clockB: GroupClock = { lamport: 5, clientId: "user-beta" };

    expect(compareLamportClientId(clockA, clockB)).toBeLessThan(0);
    expect(compareLamportClientId(clockB, clockA)).toBeGreaterThan(0);
  });

  it("should allow concurrent transform-only and style-only updates without clobbering each other", () => {
    const baseElement: ISharedElement = {
      id: "rect-1",
      type: "rectangle",
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      style: {
        strokeColor: "#000000",
        strokeWidth: 2,
      },
    };

    const elements = [baseElement];

    // Op 1: Transform move update from User A at Lamport 10
    const opTransform: IOp = {
      opId: "op-1",
      boardId: "board-1",
      type: "element.update",
      actorId: "user-a",
      lamport: 10,
      createdAt: new Date().toISOString(),
      payload: {
        id: "rect-1",
        updates: { x: 300, y: 400 },
      },
    };

    // Op 2: Style color update from User B at Lamport 10
    const opStyle: IOp = {
      opId: "op-2",
      boardId: "board-1",
      type: "element.update",
      actorId: "user-b",
      lamport: 10,
      createdAt: new Date().toISOString(),
      payload: {
        id: "rect-1",
        updates: { style: { strokeColor: "#ff0000", strokeWidth: 4 } },
      },
    };

    // Apply opTransform then opStyle
    const state1 = applyOperation(elements, opTransform);
    const finalState = applyOperation(state1, opStyle);

    const result = finalState.find((el) => el.id === "rect-1")!;

    // Transform fields from Op 1 should be preserved!
    expect(result.x).toBe(300);
    expect(result.y).toBe(400);

    // Style fields from Op 2 should be applied!
    expect(result.style).toEqual({ strokeColor: "#ff0000", strokeWidth: 4 });

    // Verify lastUpdate tracks group clocks independently
    expect(result.lastUpdate?.transform).toEqual({
      lamport: 10,
      clientId: "user-a",
    });
    expect(result.lastUpdate?.style).toEqual({
      lamport: 10,
      clientId: "user-b",
    });
  });
});
