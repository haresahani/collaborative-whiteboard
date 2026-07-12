import { describe, expect, it } from "vitest";
import type {
  ArrowElement,
  Element,
  RectangleElement,
  StrokeElement,
  TextElement,
} from "../../../models/element";
import { alignElements } from "../alignElements";
import { deleteElements } from "../deleteElements";
import { duplicateElements } from "../duplicateElements";
import { resizeElements } from "../resizeElements";
import { setElementStyle } from "../setElementStyle";
import { translateElements } from "../translateElements";

const NOW = 1_000;

function rect(id: string, x = 0, y = 0, width = 100, height = 50): RectangleElement {
  return {
    id,
    type: "rectangle",
    x,
    y,
    width,
    height,
    zIndex: 0,
    createdAt: 0,
    updatedAt: 0,
    style: { strokeColor: "#111", strokeWidth: 2, fillColor: "#eee" },
  };
}

function stroke(id: string): StrokeElement {
  return {
    id,
    type: "stroke",
    x: 10,
    y: 10,
    zIndex: 0,
    createdAt: 0,
    updatedAt: 0,
    points: [
      { x: 10, y: 10 },
      { x: 20, y: 30 },
    ],
    style: { strokeColor: "#111", strokeWidth: 2 },
  };
}

function text(id: string): TextElement {
  return {
    id,
    type: "text",
    x: 5,
    y: 5,
    width: 80,
    height: 24,
    text: "hi",
    fontSize: 20,
    zIndex: 0,
    createdAt: 0,
    updatedAt: 0,
    style: { strokeColor: "#111", strokeWidth: 2 },
  };
}

/** Arrow bound to `rect("target")` at its right-edge midpoint. */
function boundArrow(id: string, targetId: string): ArrowElement {
  return {
    id,
    type: "arrow",
    x: 100,
    y: 25,
    x1: 100,
    y1: 25,
    x2: 200,
    y2: 25,
    zIndex: 0,
    createdAt: 0,
    updatedAt: 0,
    style: { strokeColor: "#111", strokeWidth: 2 },
    startBinding: { elementId: targetId, anchor: { x: 1, y: 0.5 } },
  };
}

describe("translateElements", () => {
  it("translates each element type correctly", () => {
    const elements: Element[] = [rect("r"), stroke("s"), text("t")];

    const next = translateElements(elements, ["r", "s", "t"], 7, -3, NOW);

    const r = next.find((el) => el.id === "r") as RectangleElement;
    const s = next.find((el) => el.id === "s") as StrokeElement;
    const t = next.find((el) => el.id === "t") as TextElement;

    expect([r.x, r.y]).toEqual([7, -3]);
    expect([t.x, t.y]).toEqual([12, 2]);
    expect(s.points).toEqual([
      { x: 17, y: 7 },
      { x: 27, y: 27 },
    ]);
    expect(s.x).toBe(17);
  });

  it("re-anchors arrows bound to a moved target instead of leaving them behind", () => {
    const target = rect("target");
    const arrow = boundArrow("a", "target");

    const next = translateElements([target, arrow], ["target"], 50, 10, NOW);

    const movedArrow = next.find((el) => el.id === "a") as ArrowElement;

    // Anchor is the right-edge midpoint of the rect, now at (150, 35).
    expect(movedArrow.x1).toBe(150);
    expect(movedArrow.y1).toBe(35);
    expect(movedArrow.startBinding).toBeDefined();
  });

  it("detaches bindings when the arrow itself is moved", () => {
    const target = rect("target");
    const arrow = boundArrow("a", "target");

    const next = translateElements([target, arrow], ["a"], 10, 0, NOW);
    const movedArrow = next.find((el) => el.id === "a") as ArrowElement;

    expect(movedArrow.startBinding).toBeUndefined();
    expect(movedArrow.x1).toBe(110);
  });

  it("returns the same reference for no-ops", () => {
    const elements: Element[] = [rect("r")];

    expect(translateElements(elements, [], 5, 5, NOW)).toBe(elements);
    expect(translateElements(elements, ["r"], 0, 0, NOW)).toBe(elements);
    expect(translateElements(elements, ["missing"], 5, 5, NOW)).toBe(elements);
  });
});

describe("alignElements", () => {
  it("aligns left edges of a multi-selection", () => {
    const a = rect("a", 0, 0, 50, 50);
    const b = rect("b", 100, 100, 50, 50);

    const next = alignElements([a, b], ["a", "b"], "left", NOW);
    const alignedB = next.find((el) => el.id === "b") as RectangleElement;

    expect(alignedB.x).toBe(0);
    expect(alignedB.y).toBe(100);
  });

  it("is a no-op (same reference) for a single element", () => {
    const elements: Element[] = [rect("a")];

    expect(alignElements(elements, ["a"], "center", NOW)).toBe(elements);
  });

  it("is a no-op when elements are already aligned", () => {
    const a = rect("a", 0, 0, 50, 50);
    const b = rect("b", 0, 100, 50, 50);
    const elements: Element[] = [a, b];

    expect(alignElements(elements, ["a", "b"], "left", NOW)).toBe(elements);
  });
});

describe("resizeElements", () => {
  it("resizes a rectangle from the south-east handle", () => {
    const next = resizeElements([rect("r")], ["r"], "se", 20, 10, NOW);
    const r = next[0] as RectangleElement;

    expect([r.x, r.y, r.width, r.height]).toEqual([0, 0, 120, 60]);
  });

  it("flips a rectangle dragged through zero size", () => {
    const next = resizeElements([rect("r", 0, 0, 30, 30)], ["r"], "e", -50, 0, NOW);
    const r = next[0] as RectangleElement;

    expect(r.width).toBe(20);
    expect(r.x).toBe(-20);
  });

  it("moves the matching arrow endpoint and detaches bindings", () => {
    const arrow = boundArrow("a", "missing-target");
    const next = resizeElements([arrow], ["a"], "e", 25, 0, NOW);
    const resized = next[0] as ArrowElement;

    expect(resized.x2).toBe(225);
    expect(resized.x1).toBe(100);
    expect(resized.startBinding).toBeUndefined();
  });

  it("keeps bound arrows attached to a resized rectangle", () => {
    const target = rect("target");
    const arrow = boundArrow("a", "target");

    const next = resizeElements([target, arrow], ["target"], "e", 60, 0, NOW);
    const attached = next.find((el) => el.id === "a") as ArrowElement;

    // Right-edge midpoint moved from x=100 to x=160.
    expect(attached.x1).toBe(160);
  });
});

describe("setElementStyle", () => {
  it("applies stroke color to all types but gates type-specific fields", () => {
    const elements: Element[] = [rect("r"), stroke("s"), text("t")];

    const next = setElementStyle(
      elements,
      ["r", "s", "t"],
      { strokeColor: "#f00", fillColor: "#0f0", fontSize: 32, strokeWidth: 8 },
      NOW,
    );

    const r = next.find((el) => el.id === "r") as RectangleElement;
    const s = next.find((el) => el.id === "s") as StrokeElement;
    const t = next.find((el) => el.id === "t") as TextElement;

    expect(r.style).toMatchObject({ strokeColor: "#f00", fillColor: "#0f0", strokeWidth: 8 });
    expect(s.style).toMatchObject({ strokeColor: "#f00", strokeWidth: 8 });
    expect(s.style.fillColor).toBeUndefined();
    expect(t.style.strokeColor).toBe("#f00");
    expect(t.style.strokeWidth).toBe(2); // width does not apply to text
    expect(t.fontSize).toBe(32);
  });

  it("returns the same reference when the patch changes nothing applicable", () => {
    const elements: Element[] = [stroke("s")];

    expect(setElementStyle(elements, ["s"], { fillColor: "#0f0" }, NOW)).toBe(
      elements,
    );
    expect(setElementStyle(elements, [], { strokeColor: "#f00" }, NOW)).toBe(
      elements,
    );
  });
});

describe("deleteElements", () => {
  it("removes elements and drops bindings that pointed at them", () => {
    const target = rect("target");
    const arrow = boundArrow("a", "target");

    const next = deleteElements([target, arrow], ["target"], NOW);

    expect(next).toHaveLength(1);
    const survivor = next[0] as ArrowElement;
    expect(survivor.id).toBe("a");
    expect(survivor.startBinding).toBeUndefined();
  });

  it("returns the same reference when nothing matches", () => {
    const elements: Element[] = [rect("r")];

    expect(deleteElements(elements, ["nope"], NOW)).toBe(elements);
    expect(deleteElements(elements, [], NOW)).toBe(elements);
  });
});

describe("duplicateElements", () => {
  it("clones with new ids, offset, and remapped internal bindings", () => {
    const target = rect("target");
    const arrow = boundArrow("a", "target");
    let counter = 0;
    const newId = () => `new-${++counter}`;

    const { elements: next, newIds } = duplicateElements(
      [target, arrow],
      ["target", "a"],
      { x: 20, y: 20 },
      newId,
      NOW,
    );

    expect(next).toHaveLength(4);
    expect(newIds).toEqual(["new-1", "new-2"]);

    const clonedRect = next.find((el) => el.id === "new-1") as RectangleElement;
    const clonedArrow = next.find((el) => el.id === "new-2") as ArrowElement;

    expect([clonedRect.x, clonedRect.y]).toEqual([20, 20]);
    expect(clonedArrow.x1).toBe(120);
    expect(clonedArrow.startBinding?.elementId).toBe("new-1");
  });

  it("drops bindings whose target was not duplicated", () => {
    const target = rect("target");
    const arrow = boundArrow("a", "target");

    const { elements: next } = duplicateElements(
      [target, arrow],
      ["a"],
      { x: 20, y: 20 },
      () => "clone",
      NOW,
    );

    const clonedArrow = next.find((el) => el.id === "clone") as ArrowElement;
    expect(clonedArrow.startBinding).toBeUndefined();
  });

  it("returns the same reference and no ids for an empty selection", () => {
    const elements: Element[] = [rect("r")];
    const result = duplicateElements(elements, [], { x: 20, y: 20 }, () => "x", NOW);

    expect(result.elements).toBe(elements);
    expect(result.newIds).toEqual([]);
  });
});
