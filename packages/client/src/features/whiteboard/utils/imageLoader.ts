import { generateUUID } from "../../../lib/utils";
import type { ImageElement } from "../models/element";
import { loadAndCacheImage } from "../engine/shapes/imageShape";

const VALID_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "ico", "webp"];

/**
 * Checks whether a given File object is a supported image (.jpg, .jpeg, .png, .gif, .ico, .webp).
 */
export function isValidImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return !!ext && VALID_EXTENSIONS.includes(ext);
}

/**
 * Reads an image File as Data URL and creates a centered ImageElement at the specified target world position.
 */
export function processImageFile(
  file: File,
  targetWorld: { x: number; y: number },
  currentElementsCount: number,
  onComplete: (imageElement: ImageElement) => void,
  onError?: (msg: string) => void,
) {
  if (!isValidImageFile(file)) {
    onError?.(`File "${file.name}" is not a supported image format (.jpg, .jpeg, .png, .gif, .ico).`);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const src = e.target?.result as string;
    if (!src) {
      onError?.("Failed to read image content.");
      return;
    }

    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth || 400;
      const naturalHeight = img.naturalHeight || 300;

      const maxDim = 420;
      const aspect = naturalWidth / naturalHeight;
      let width = naturalWidth;
      let height = naturalHeight;

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          width = maxDim;
          height = maxDim / aspect;
        } else {
          height = maxDim;
          width = maxDim * aspect;
        }
      }

      const newImage: ImageElement = {
        id: generateUUID(),
        type: "image",
        src,
        x: targetWorld.x - width / 2,
        y: targetWorld.y - height / 2,
        width: Math.round(width),
        height: Math.round(height),
        style: {
          strokeColor: "#000000",
          strokeWidth: 0,
        },
        zIndex: currentElementsCount,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      loadAndCacheImage(src);
      onComplete(newImage);
    };

    img.onerror = () => {
      onError?.("Failed to decode image data.");
    };

    img.src = src;
  };

  reader.readAsDataURL(file);
}
