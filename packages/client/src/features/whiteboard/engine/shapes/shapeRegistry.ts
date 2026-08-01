import type { Element, ElementType } from "../../models/element";
import type { Shape } from "./Shape";

import { strokeShape } from "./strokeShape";
import { rectangleShape } from "./rectangleShape";
import { ellipseShape } from "./ellipseShape";
import { pathShape } from "./pathShape";
import { stickyShape } from "./stickyShape";
import { arrowShape } from "./arrowShape";
import { textShape } from "./textShape";

type ShapeMap = Record<ElementType, Shape<Element>>;

const registry: ShapeMap = {
  stroke: strokeShape as Shape<Element>,
  rectangle: rectangleShape as Shape<Element>,
  ellipse: ellipseShape as Shape<Element>,
  path: pathShape as Shape<Element>,
  sticky: stickyShape as Shape<Element>,
  arrow: arrowShape as Shape<Element>,
  text: textShape as Shape<Element>,
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
