import type { Element } from "../../models/element";
import { hitTestElement } from "../shapes/shapeRegistry";

export function findBindableElement(
  x: number,
  y: number,
  elements: Element[],
): Element | null {
  const hit = [...elements]
    .slice()
    .reverse()
    .find((el) => hitTestElement(x, y, el));

  if (!hit) return null;

  if (hit.type === "arrow") return null;

  return hit;
}
