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

    if (!isSupported) {
      try {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      } catch {
        // ignore if canvas was previously transferred
      }
      isOffscreenSupportedRef.current = false;

      const handleResize = () => {
        if (canvasRef.current) {
          try {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
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
          width: window.innerWidth,
          height: window.innerHeight,
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
          width: window.innerWidth,
          height: window.innerHeight,
        },
        [offscreen],
      );

      workerRef.current = worker;
      isOffscreenSupportedRef.current = true;

      const handleResize = () => {
        if (workerRef.current) {
          workerRef.current.postMessage({
            type: "resize",
            width: window.innerWidth,
            height: window.innerHeight,
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
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      } catch {
        // ignore
      }
    }
  }, [canvasRef]);

  const render = useCallback(
    (state: RenderState) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isOffscreenSupportedRef.current && workerRef.current) {
        workerRef.current.postMessage({
          type: "render",
          ...state,
          width: window.innerWidth,
          height: window.innerHeight,
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
