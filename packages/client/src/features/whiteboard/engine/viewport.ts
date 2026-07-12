import type { Point } from "../models/element";

export interface Viewport {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export function screenToWorld(screen: Point, viewport: Viewport): Point {
  return {
    x: (screen.x - viewport.offsetX) / viewport.zoom,
    y: (screen.y - viewport.offsetY) / viewport.zoom,
  };
}

export function worldToScreen(world: Point, viewport: Viewport): Point {
  return {
    x: world.x * viewport.zoom + viewport.offsetX,
    y: world.y * viewport.zoom + viewport.offsetY,
  };
}
