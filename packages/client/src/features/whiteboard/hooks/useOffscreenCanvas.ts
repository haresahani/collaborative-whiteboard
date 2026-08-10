import { useEffect, useRef, useCallback } from "react";
import type { Element } from "../models/element";
import { renderElements } from "../engine/renderer";

export interface RenderState {
  elements: Element[];
  tempElement: Element | null;
  offsetX: number;
  offsetY: number;
  zoom: number;
  selectedIds: string[];
  marquee: { x: number; y: number; width: number; height: number } | null;
  otherTempElements: Element[];
  isDark?: boolean;
}

type TransferredCanvas = HTMLCanvasElement & {
  __offscreenTransferred?: boolean;
};

export function useOffscreenCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const workerRef = useRef<Worker | null>(null);
  const isOffscreenSupportedRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current as TransferredCanvas | null;
    if (!canvas) return;

    // Check if OffscreenCanvas is supported by browser & element
    const isSupported =
      typeof OffscreenCanvas !== "undefined" &&
      typeof canvas.transferControlToOffscreen === "function" &&
      typeof Worker !== "undefined";

    const getCanvasDimensions = () => {
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      return {
        width: Math.floor(window.innerWidth * dpr),
        height: Math.floor(window.innerHeight * dpr),
      };
    };

    const { width, height } = getCanvasDimensions();

    if (!isSupported) {
      try {
        canvas.width = width;
        canvas.height = height;
      } catch {
        // ignore if canvas was previously transferred
      }
      isOffscreenSupportedRef.current = false;

      const handleResize = () => {
        if (canvasRef.current) {
          try {
            const dims = getCanvasDimensions();
            canvasRef.current.width = dims.width;
            canvasRef.current.height = dims.height;
          } catch {
            // ignore
          }
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    // Check if this HTMLCanvasElement was already transferred (e.g. React StrictMode re-mount)
    if (canvas.__offscreenTransferred) {
      if (workerRef.current) {
        isOffscreenSupportedRef.current = true;
        workerRef.current.postMessage({
          type: "resize",
          width,
          height,
        });
      }
      return;
    }

    try {
      const worker = new Worker(
        new URL("../engine/renderWorker.ts", import.meta.url),
        { type: "module" },
      );

      const offscreen = canvas.transferControlToOffscreen();
      canvas.__offscreenTransferred = true;

      worker.postMessage(
        {
          type: "init",
          canvas: offscreen,
          width,
          height,
        },
        [offscreen],
      );

      workerRef.current = worker;
      isOffscreenSupportedRef.current = true;

      const handleResize = () => {
        if (workerRef.current) {
          const dims = getCanvasDimensions();
          workerRef.current.postMessage({
            type: "resize",
            width: dims.width,
            height: dims.height,
          });
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    } catch (err) {
      console.warn(
        "[useOffscreenCanvas] Web Worker fallback to main thread:",
        err,
      );
      isOffscreenSupportedRef.current = false;
      try {
        canvas.width = width;
        canvas.height = height;
      } catch {
        // ignore
      }
    }
  }, [canvasRef]);

  const render = useCallback(
    (state: RenderState) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);

      // Read theme on the main thread — safe here, NOT safe in Web Worker
      const isDark =
        typeof document !== "undefined" &&
        document.documentElement.getAttribute("data-theme") === "dark";

      if (isOffscreenSupportedRef.current && workerRef.current) {
        workerRef.current.postMessage({
          type: "render",
          ...state,
          width,
          height,
          isDark,
        });
      } else {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          renderElements(
            ctx,
            state.elements,
            state.tempElement,
            state.offsetX,
            state.offsetY,
            state.zoom,
            state.selectedIds,
            state.marquee,
            state.otherTempElements,
            isDark,
          );
        }
      }
    },
    [canvasRef],
  );

  const isOffscreenSupported =
    typeof OffscreenCanvas !== "undefined" && typeof Worker !== "undefined";

  return {
    render,
    isOffscreenSupported,
  };
}
