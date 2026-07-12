import { describe, expect, it } from "vitest";
import { screenToWorld, worldToScreen, type Viewport } from "../viewport";

const VIEWPORTS: Viewport[] = [
  { offsetX: 0, offsetY: 0, zoom: 1 },
  { offsetX: 120, offsetY: -45, zoom: 0.2 },
  { offsetX: -300, offsetY: 80, zoom: 4 },
];

describe("viewport", () => {
  it("converts screen to world at identity viewport", () => {
    const world = screenToWorld(
      { x: 50, y: 75 },
      { offsetX: 0, offsetY: 0, zoom: 1 },
    );

    expect(world).toEqual({ x: 50, y: 75 });
  });

  it("applies pan offset before zoom division", () => {
    const world = screenToWorld(
      { x: 220, y: 130 },
      { offsetX: 20, offsetY: 30, zoom: 2 },
    );

    expect(world).toEqual({ x: 100, y: 50 });
  });

  it("round-trips screen -> world -> screen across zoom levels", () => {
    const screen = { x: 431, y: -87 };

    for (const viewport of VIEWPORTS) {
      const roundTripped = worldToScreen(
        screenToWorld(screen, viewport),
        viewport,
      );

      expect(roundTripped.x).toBeCloseTo(screen.x, 10);
      expect(roundTripped.y).toBeCloseTo(screen.y, 10);
    }
  });

  it("round-trips world -> screen -> world across zoom levels", () => {
    const world = { x: -12.5, y: 964 };

    for (const viewport of VIEWPORTS) {
      const roundTripped = screenToWorld(
        worldToScreen(world, viewport),
        viewport,
      );

      expect(roundTripped.x).toBeCloseTo(world.x, 10);
      expect(roundTripped.y).toBeCloseTo(world.y, 10);
    }
  });
});
