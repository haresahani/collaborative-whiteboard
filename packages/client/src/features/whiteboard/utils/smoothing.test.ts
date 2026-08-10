import { describe, it, expect } from "vitest";
import { computeCatmullRomBezierSegments } from "./smoothing";

describe("Catmull-Rom Bezier Smoothing", () => {
  it("computes smooth Bezier control segments for a sequence of points", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 30, y: 25 },
      { x: 50, y: 10 },
    ];

    const segments = computeCatmullRomBezierSegments(points);
    expect(segments.length).toBe(3);

    for (let i = 0; i < segments.length; i++) {
      expect(segments[i].p0).toEqual(points[i]);
      expect(segments[i].p1).toEqual(points[i + 1]);
      expect(segments[i].cp1).toHaveProperty("x");
      expect(segments[i].cp1).toHaveProperty("y");
      expect(segments[i].cp2).toHaveProperty("x");
      expect(segments[i].cp2).toHaveProperty("y");
    }
  });

  it("handles 2 points smoothly as a straight Bezier segment", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];

    const segments = computeCatmullRomBezierSegments(points);
    expect(segments.length).toBe(1);
    expect(segments[0].p0).toEqual(points[0]);
    expect(segments[0].p1).toEqual(points[1]);
  });
});
