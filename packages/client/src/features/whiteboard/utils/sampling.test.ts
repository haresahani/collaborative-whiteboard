import { describe, it, expect } from "vitest";
import { samplePoint, simplifyRDP } from "./sampling";

describe("sampling and RDP simplification", () => {
  it("filters points closer than minDistance", () => {
    const points = [{ x: 0, y: 0 }];
    const closePoint = { x: 1, y: 1 }; // Distance ~1.41px < 2.5px
    const farPoint = { x: 10, y: 10 }; // Distance ~14.14px > 2.5px

    const sampled1 = samplePoint(points, closePoint, 2.5);
    expect(sampled1.length).toBe(1);

    const sampled2 = samplePoint(points, farPoint, 2.5);
    expect(sampled2.length).toBe(2);
    expect(sampled2[1]).toEqual(farPoint);
  });

  it("dramatically simplifies collinear / near-collinear points using RDP", () => {
    // Generate 50 points along a nearly straight line with minor noise
    const rawPoints = Array.from({ length: 50 }, (_, i) => ({
      x: i * 2,
      y: i * 2 + (i % 2 === 0 ? 0.2 : -0.2),
    }));

    const simplified = simplifyRDP(rawPoints, 1.2);
    expect(simplified.length).toBeLessThan(10);
    expect(simplified[0]).toEqual(rawPoints[0]);
    expect(simplified[simplified.length - 1]).toEqual(
      rawPoints[rawPoints.length - 1],
    );
  });
});
