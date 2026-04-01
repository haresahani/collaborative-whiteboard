import { create } from "zustand";

type ViewportState = {
  offsetX: number;
  offsetY: number;
  zoom: number;

  pan: (dx: number, dy: number) => void;
  zoomAt: (screenX: number, screenY: number, delta: number) => void;
};

export const useViewportStore = create<ViewportState>((set, get) => ({
  offsetX: 0,
  offsetY: 0,
  zoom: 1,

  pan: (dx, dy) =>
    set((state) => ({
      offsetX: state.offsetX + dx,
      offsetY: state.offsetY + dy,
    })),

  zoomAt: (screenX, screenY, delta) => {
    const { zoom, offsetX, offsetY } = get();

    const newZoom = Math.min(Math.max(zoom + delta, 0.2), 4);

    const worldX = (screenX - offsetX) / zoom;
    const worldY = (screenY - offsetY) / zoom;

    const newOffsetX = screenX - worldX * newZoom;
    const newOffsetY = screenY - worldY * newZoom;

    set({
      zoom: newZoom,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    });
  },
}));
