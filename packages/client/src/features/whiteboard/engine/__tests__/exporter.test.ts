import { describe, it, expect } from "vitest";
import { exportToJSON } from "../exporter";
import type { Element } from "../../models/element";

describe("Exporter Engine", () => {
  const e1: Element = {
    id: "e1",
    type: "rectangle",
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    style: {
      strokeColor: "#000000",
      fillColor: "#ffffff",
      strokeWidth: 2,
    },
    zIndex: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it("should serialize elements to JSON format correctly", () => {
    const jsonStr = exportToJSON([e1], "Test Board", "board-1");
    const parsed = JSON.parse(jsonStr);

    expect(parsed.boardId).toBe("board-1");
    expect(parsed.boardName).toBe("Test Board");
    expect(parsed.elementsCount).toBe(1);
    expect(parsed.elements[0].id).toBe("e1");
  });
});
