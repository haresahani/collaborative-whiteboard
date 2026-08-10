import type { ImageElement } from "../../models/element";
import type { Shape } from "./Shape";

const bitmapCache = new Map<string, ImageBitmap | HTMLImageElement>();
const pendingLoads = new Set<string>();

let imageCacheVersion = 0;
const listeners = new Set<() => void>();

export function subscribeImageCache(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getImageCacheVersion() {
  return imageCacheVersion;
}

export function notifyImageCacheUpdated() {
  imageCacheVersion++;
  listeners.forEach((fn) => fn());
}

export function loadAndCacheImage(src: string) {
  if (!src || bitmapCache.has(src) || pendingLoads.has(src)) return;

  pendingLoads.add(src);

  if (typeof createImageBitmap !== "undefined" && typeof fetch !== "undefined") {
    fetch(src)
      .then((res) => res.blob())
      .then((blob) => createImageBitmap(blob))
      .then((bitmap) => {
        bitmapCache.set(src, bitmap);
        pendingLoads.delete(src);
        notifyImageCacheUpdated();
      })
      .catch(() => {
        if (typeof Image !== "undefined") {
          const img = new Image();
          img.onload = () => {
            bitmapCache.set(src, img);
            pendingLoads.delete(src);
            notifyImageCacheUpdated();
          };
          img.onerror = () => pendingLoads.delete(src);
          img.src = src;
        } else {
          pendingLoads.delete(src);
        }
      });
  } else if (typeof Image !== "undefined") {
    const img = new Image();
    img.onload = () => {
      bitmapCache.set(src, img);
      pendingLoads.delete(src);
      notifyImageCacheUpdated();
    };
    img.onerror = () => pendingLoads.delete(src);
    img.src = src;
  }
}

export const imageShape: Shape<ImageElement> = {
  draw(ctx, element, selected) {
    const {
      x,
      y,
      width,
      height,
      src,
      opacity = 1,
      flipX = false,
      flipY = false,
    } = element;

    ctx.save();

    if (opacity !== undefined && opacity < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    }

    const cx = x + width / 2;
    const cy = y + height / 2;

    ctx.translate(cx, cy);

    if (flipX || flipY) {
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    }

    const drawX = -width / 2;
    const drawY = -height / 2;

    let cached = bitmapCache.get(src);
    if (!cached) {
      loadAndCacheImage(src);
      cached = bitmapCache.get(src);
    }

    if (cached) {
      try {
        ctx.drawImage(cached, drawX, drawY, width, height);
      } catch (err) {
        console.error("drawImage error:", err);
      }
    } else {
      // Placeholder while loading
      ctx.fillStyle = "rgba(30, 41, 59, 0.6)";
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(drawX, drawY, width, height);
      ctx.strokeRect(drawX, drawY, width, height);
    }

    if (selected) {
      ctx.setLineDash([]);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX, drawY, width, height);
    }

    ctx.restore();
  },

  hitTest(x, y, element) {
    return (
      x >= element.x &&
      x <= element.x + element.width &&
      y >= element.y &&
      y <= element.y + element.height
    );
  },

  getBounds(element) {
    return {
      minX: element.x,
      minY: element.y,
      maxX: element.x + element.width,
      maxY: element.y + element.height,
    };
  },
};
