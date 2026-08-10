import { describe, expect, it } from "vitest";
import type {
  ArrowElement,
  RectangleElement,
  StrokeElement,
  TextElement,
} from "../../models/element";
import { materializeClipboard, serializeSelection } from "../clipboard";

const NOW = 5_000;

function rect(id: string, x = 0, y = 0): RectangleElement {
  return {
    id,
    type: "rectangle",
    x,
    y,
    width: 100,
    height: 50,
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
      { x: 30, y: 40 },
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
    text: "hello",
    fontSize: 20,
    zIndex: 0,
    createdAt: 0,
    updatedAt: 0,
    style: { strokeColor: "#111", strokeWidth: 2 },
  };
}

function arrow(id: string, boundTo?: string): ArrowElement {
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
    startBinding: boundTo
      ? { elementId: boundTo, anchor: { x: 1, y: 0.5 } }
      : undefined,
  };
}

describe("serializeSelection", () => {
  it("returns null for an empty selection", () => {
    expect(serializeSelection([rect("r")], [])).toBeNull();
    expect(serializeSelection([rect("r")], ["missing"])).toBeNull();
  });

  it("deep-copies so later mutations do not affect the payload", () => {
    const s = stroke("s");
    const payload = serializeSelection([s], ["s"])!;

    s.points[0].x = 999;

    expect((payload.elements[0] as StrokeElement).points[0].x).toBe(10);
  });
});

describe("materializeClipboard", () => {
  it("round-trips a mixed selection with new ids and an offset", () => {
    const elements = [rect("r"), stroke("s"), text("t")];
    const payload = serializeSelection(elements, ["r", "s", "t"])!;

    let counter = 0;
    const clones = materializeClipboard(
      payload,
      { x: 20, y: 20 },
      () => `paste-${++counter}`,
      NOW,
    );

    expect(clones).toHaveLength(3);
    expect(clones.map((c) => c.id)).toEqual(["paste-1", "paste-2", "paste-3"]);

    const clonedRect = clones.find((c) => c.type === "rectangle")!;
    const clonedStroke = clones.find(
      (c) => c.type === "stroke",
    ) as StrokeElement;
    const clonedText = clones.find((c) => c.type === "text") as TextElement;

    expect([clonedRect.x, clonedRect.y]).toEqual([20, 20]);
    expect(clonedStroke.points[0]).toEqual({ x: 30, y: 30 });
    expect(clonedText.text).toBe("hello");
    expect(clonedText.x).toBe(25);
  });

  it("remaps bindings onto co-pasted targets", () => {
    const elements = [rect("target"), arrow("a", "target")];
    const payload = serializeSelection(elements, ["target", "a"])!;

    let counter = 0;
    const clones = materializeClipboard(
      payload,
      { x: 20, y: 20 },
      () => `paste-${++counter}`,
      NOW,
    );

    const clonedArrow = clones.find((c) => c.type === "arrow") as ArrowElement;
    const clonedRect = clones.find((c) => c.type === "rectangle")!;

    expect(clonedArrow.startBinding?.elementId).toBe(clonedRect.id);
  });

  it("drops bindings whose target was not copied", () => {
    const elements = [rect("target"), arrow("a", "target")];
    const payload = serializeSelection(elements, ["a"])!;

    const clones = materializeClipboard(
      payload,
      { x: 20, y: 20 },
      () => "paste-1",
      NOW,
    );

    expect((clones[0] as ArrowElement).startBinding).toBeUndefined();
  });

  it("can paste the same payload repeatedly with distinct ids", () => {
    const payload = serializeSelection([rect("r")], ["r"])!;

    let counter = 0;
    const first = materializeClipboard(
      payload,
      { x: 20, y: 20 },
      () => `p-${++counter}`,
      NOW,
    );
    const second = materializeClipboard(
      payload,
      { x: 40, y: 40 },
      () => `p-${++counter}`,
      NOW,
    );

    expect(first[0].id).not.toBe(second[0].id);
    expect((second[0] as RectangleElement).x).toBe(40);
  });
});
