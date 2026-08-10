import { describe, it, expect } from "vitest";
import { reorderElements } from "../reorderElements";
import type { Element } from "../../../models/element";

function createDummyElement(id: string, zIndex: number): Element {
  return {
    id,
    type: "rectangle",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    zIndex,
    createdAt: 1000,
    updatedAt: 1000,
    style: { strokeColor: "#000", strokeWidth: 1 },
  };
}

describe("reorderElements mutation", () => {
  const elA = createDummyElement("A", 0);
  const elB = createDummyElement("B", 1);
  const elC = createDummyElement("C", 2);
  const elements = [elA, elB, elC];

  it("should bring selected element to front", () => {
    const result = reorderElements(elements, ["A"], "bringToFront");
    expect(result.map((e) => e.id)).toEqual(["B", "C", "A"]);
  });

  it("should send selected element to back", () => {
    const result = reorderElements(elements, ["C"], "sendToBack");
    expect(result.map((e) => e.id)).toEqual(["C", "A", "B"]);
  });

  it("should bring element 1 level forward", () => {
    const result = reorderElements(elements, ["A"], "bringForward");
    expect(result.map((e) => e.id)).toEqual(["B", "A", "C"]);
  });

  it("should send element 1 level backward", () => {
    const result = reorderElements(elements, ["C"], "sendBackward");
    expect(result.map((e) => e.id)).toEqual(["A", "C", "B"]);
  });
});
