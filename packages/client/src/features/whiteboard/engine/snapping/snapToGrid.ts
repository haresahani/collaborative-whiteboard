const GRID_SIZE = 10;
const SNAP_THRESHOLD = 5;

export function snapToGrid(x: number, y: number) {
  const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE;
  const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE;

  const snapX = Math.abs(x - gridX) < SNAP_THRESHOLD ? gridX : x;
  const snapY = Math.abs(y - gridY) < SNAP_THRESHOLD ? gridY : y;

  return {
    x: snapX,
    y: snapY,
  };
}
