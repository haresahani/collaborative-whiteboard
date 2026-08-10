import { describe, it, expect } from "vitest";
import { alignElements } from "../alignment";
import type { Element } from "../../../models/element";

function createMockRectangle(id: string, x: number, y: number, width: number, height: number): Element {
  return {
    id,
    type: "rectangle",
    x,
    y,
    width,
    height,
    style: {
      strokeColor: "#000000",
      fillColor: "#ffffff",
      strokeWidth: 2,
    },
    zIndex: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe("Alignment Engine Math", () => {
  const e1 = createMockRectangle("1", 0, 10, 100, 50);
  const e2 = createMockRectangle("2", 50, 40, 60, 60);
  const e3 = createMockRectangle("3", 200, 100, 100, 100);

  it("should align elements to the left (minX = 0)", () => {
    const res = alignElements([e1, e2, e3], "left");
    expect(res.get("1")?.x).toBe(0);
    expect(res.get("2")?.x).toBe(0);
    expect(res.get("3")?.x).toBe(0);
  });

  it("should align elements to the right (maxX = 300)", () => {
    const res = alignElements([e1, e2, e3], "right");
    // e1 width 100 => x = 200
    // e2 width 60 => x = 240
    // e3 width 100 => x = 200
    expect(res.get("1")?.x).toBe(200);
    expect(res.get("2")?.x).toBe(240);
    expect(res.get("3")?.x).toBe(200);
  });

  it("should align elements horizontally centered (groupCenterX = 150)", () => {
    const res = alignElements([e1, e2, e3], "center");
    // groupMinX = 0, groupMaxX = 300 => center = 150
    // e1 width 100 => x = 100
    // e2 width 60 => x = 120
    // e3 width 100 => x = 100
    expect(res.get("1")?.x).toBe(100);
    expect(res.get("2")?.x).toBe(120);
    expect(res.get("3")?.x).toBe(100);
  });

  it("should distribute 3 elements horizontally with equal gaps", () => {
    // e1: x=0, w=100
    // e2: x=50, w=100
    // e3: x=300, w=100
    const item1 = createMockRectangle("1", 0, 0, 100, 100);
    const item2 = createMockRectangle("2", 50, 0, 100, 100);
    const item3 = createMockRectangle("3", 300, 0, 100, 100);

    const res = alignElements([item1, item2, item3], "distribute-horizontal");
    // Span = 400 - 0 = 400. Sum of widths = 300. Gap total = 100.
    // Gap per item = 100 / 2 = 50.
    // Item 1: x = 0
    // Item 2: x = 0 + 100 + 50 = 150
    // Item 3: x = 150 + 100 + 50 = 300
    expect(res.get("1")?.x).toBe(0);
    expect(res.get("2")?.x).toBe(150);
    expect(res.get("3")?.x).toBe(300);
  });
});
