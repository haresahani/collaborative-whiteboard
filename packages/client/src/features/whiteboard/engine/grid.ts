import type { CanvasContext } from "./shapes/Shape";

export type GridStyle = "dots" | "lines" | "none";

export function renderGrid(
  ctx: CanvasContext,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
  isDark = false,
  gridStyle: GridStyle = "dots",
) {
  if (gridStyle === "none") return;

  const gridSize = Math.max(22 * zoom, 18);
  const majorEvery = 4;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const startX = offsetX % gridSize;
  const startY = offsetY % gridSize;

  if (gridStyle === "lines") {
    ctx.lineWidth = 1;
    let columnIndex = 0;
    for (let x = startX; x < width; x += gridSize) {
      const isMajor = columnIndex % majorEvery === 0;
      ctx.beginPath();
      ctx.strokeStyle = isDark
        ? isMajor ? "rgba(200,200,200,0.12)" : "rgba(200,200,200,0.05)"
        : isMajor ? "rgba(100,100,100,0.15)" : "rgba(100,100,100,0.07)";
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      columnIndex += 1;
    }

    let rowIndex = 0;
    for (let y = startY; y < height; y += gridSize) {
      const isMajor = rowIndex % majorEvery === 0;
      ctx.beginPath();
      ctx.strokeStyle = isDark
        ? isMajor ? "rgba(200,200,200,0.12)" : "rgba(200,200,200,0.05)"
        : isMajor ? "rgba(100,100,100,0.15)" : "rgba(100,100,100,0.07)";
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      rowIndex += 1;
    }
  } else {
    // Default "dots" mode
    let columnIndex = 0;
    for (let x = startX; x < width; x += gridSize) {
      let rowIndex = 0;
      for (let y = startY; y < height; y += gridSize) {
        const isMajor =
          columnIndex % majorEvery === 0 && rowIndex % majorEvery === 0;
        const radius = isMajor ? 1.35 : 0.7;

        ctx.beginPath();
        ctx.fillStyle = isDark
          ? isMajor ? "rgba(200,200,200,0.14)" : "rgba(200,200,200,0.07)"
          : isMajor ? "rgba(151,123,84,0.22)"  : "rgba(151,123,84,0.12)";
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        rowIndex += 1;
      }
      columnIndex += 1;
    }
  }

  ctx.restore();
}
