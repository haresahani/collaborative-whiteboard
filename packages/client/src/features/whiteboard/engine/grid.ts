export function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
) {
  const gridSize = Math.max(22 * zoom, 18);
  const majorEvery = 4;

  ctx.save();

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const startX = offsetX % gridSize;
  const startY = offsetY % gridSize;

  let columnIndex = 0;
  for (let x = startX; x < width; x += gridSize) {
    let rowIndex = 0;
    for (let y = startY; y < height; y += gridSize) {
      const isMajor =
        columnIndex % majorEvery === 0 && rowIndex % majorEvery === 0;
      const radius = isMajor ? 1.35 : 0.7;

      ctx.beginPath();
      ctx.fillStyle = isMajor
        ? "rgba(151, 123, 84, 0.22)"
        : "rgba(151, 123, 84, 0.12)";
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      rowIndex += 1;
    }
    columnIndex += 1;
  }

  ctx.restore();
}
