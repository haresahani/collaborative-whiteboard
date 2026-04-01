import type { Element } from "../../models/element";
import { getSelectionBounds } from "../geometry/bounds";
import { addSnapGuide, clearSnapGuides } from "./snapGuids";

const SNAP_THRESHOLD_PX = 6;

export function snapToElements(
  x: number,
  y: number,
  movingBounds: { minX: number; minY: number; maxX: number; maxY: number },
  elements: Element[],
  zoom = 1,
) {
  clearSnapGuides();
  const threshold = SNAP_THRESHOLD_PX / Math.max(zoom, 0.0001);

  let snappedX = x;
  let snappedY = y;

  const movingCenterX = (movingBounds.minX + movingBounds.maxX) / 2;
  const movingCenterY = (movingBounds.minY + movingBounds.maxY) / 2;

  for (const el of elements) {
    const b = getSelectionBounds([el]);

    const targetsX = [b.minX, (b.minX + b.maxX) / 2, b.maxX];

    const targetsY = [b.minY, (b.minY + b.maxY) / 2, b.maxY];

    for (const tx of targetsX) {
      // left edge
      if (Math.abs(movingBounds.minX - tx) < threshold) {
        snappedX = tx;
        addSnapGuide({ type: "vertical", position: tx });
      }

      // right edge
      if (Math.abs(movingBounds.maxX - tx) < threshold) {
        snappedX = tx - (movingBounds.maxX - movingBounds.minX);
        addSnapGuide({ type: "vertical", position: tx });
      }

      // center
      if (Math.abs(movingCenterX - tx) < threshold) {
        snappedX = tx - (movingCenterX - movingBounds.minX);
        addSnapGuide({ type: "vertical", position: tx });
      }
    }

    for (const ty of targetsY) {
      // top edge
      if (Math.abs(movingBounds.minY - ty) < threshold) {
        snappedY = ty;
        addSnapGuide({ type: "horizontal", position: ty });
      }

      // bottom edge
      if (Math.abs(movingBounds.maxY - ty) < threshold) {
        snappedY = ty - (movingBounds.maxY - movingBounds.minY);
        addSnapGuide({ type: "horizontal", position: ty });
      }

      // center
      if (Math.abs(movingCenterY - ty) < threshold) {
        snappedY = ty - (movingCenterY - movingBounds.minY);
        addSnapGuide({ type: "horizontal", position: ty });
      }
    }
  }

  return {
    x: snappedX,
    y: snappedY,
  };
}
