import type { Element, ElementType } from "../../models/element";
import type { Shape } from "./Shape";

import { strokeShape } from "./strokeShape";
import { rectangleShape } from "./rectangleShape";
import { arrowShape } from "./arrowShape";
import { textShape } from "./textShape";

type ShapeMap = Record<ElementType, Shape<Element>>;

const registry: ShapeMap = {
  stroke: strokeShape,
  rectangle: rectangleShape,
  arrow: arrowShape,
  text: textShape,
};

export function getShape(type: ElementType): Shape<Element> {
  return registry[type];
}

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: Element,
  selected = false,
) {
  const shape = getShape(element.type);
  shape.draw(ctx, element, selected);
}

export function hitTestElement(
  x: number,
  y: number,
  element: Element,
): boolean {
  const shape = getShape(element.type);
  return shape.hitTest(x, y, element);
}

export function getElementBounds(element: Element) {
  const shape = getShape(element.type);
  return shape.getBounds(element);
}
