import type { Element } from "../../models/element";

// export interface Shape<T extends Element = Element> {
//   draw(
//     ctx: CanvasRenderingContext2D,
//     element: T,
//     selected: boolean,
//   ): void;

//   hitTest?(
//     x: number,
//     y: number,
//     element: T,
//   ): boolean;
// }

export interface Shape<T extends Element = Element> {
  draw(ctx: CanvasRenderingContext2D, element: T, selected: boolean): void;
  hitTest(x: number, y: number, element: T): boolean;
  getBounds(element: T): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}
